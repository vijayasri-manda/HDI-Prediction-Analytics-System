"""Reproducible UNDP reconstruction benchmark; never a causal or future forecast."""
from pathlib import Path
import hashlib
import json
import sys
import numpy as np
import pandas as pd
import sklearn
from sklearn.base import clone
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.inspection import permutation_importance

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/data'
FEATURES = ['life_expectancy', 'expected_schooling', 'mean_schooling', 'gni_per_capita']
SOURCE = 'https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv'

def metrics(y, pred):
    pred = np.clip(pred,0,1)
    return dict(mae=float(mean_absolute_error(y,pred)), rmse=float(np.sqrt(mean_squared_error(y,pred))), r2=float(r2_score(y,pred)))

def transform(frame):
    x = frame[FEATURES].to_numpy(dtype=float).copy()
    x[:,3] = np.log(x[:,3])
    return x

def formula(frame):
    health = np.clip((frame.life_expectancy.to_numpy()-20)/65,0,1)
    education = (np.clip(frame.expected_schooling.to_numpy()/18,0,1)+np.clip(frame.mean_schooling.to_numpy()/15,0,1))/2
    income = np.clip(np.log(frame.gni_per_capita.to_numpy()/100)/np.log(750),0,1)
    return np.cbrt(health*education*income)

def dump(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False), encoding='utf-8')

def run():
    OUT.mkdir(parents=True, exist_ok=True)
    raw_path = ROOT / 'data/raw/undp_hdr2025.csv'
    raw = pd.read_csv(raw_path, encoding='cp1252')
    # Rank excludes world/region/development aggregates, even where they have three-letter codes.
    countries = raw[raw.hdi_rank_2023.notna() & raw.iso3.str.fullmatch('[A-Z]{3}',na=False)]
    mapping = dict(life_expectancy='le',expected_schooling='eys',mean_schooling='mys',gni_per_capita='gnipc',hdi='hdi')
    panels = []
    for year in range(1990,2024):
        part = countries[['iso3','country']].copy()
        part['year'] = year
        for field, prefix in mapping.items():
            part[field] = pd.to_numeric(countries[f'{prefix}_{year}'], errors='coerce')
        panels.append(part)
    panel = pd.concat(panels, ignore_index=True)
    original_count = len(panel)
    panel = panel.dropna(subset=FEATURES+['hdi']).reset_index(drop=True)
    assert not panel.duplicated(['iso3','year']).any()
    assert np.isfinite(panel[FEATURES+['hdi']].to_numpy()).all()
    assert panel.gni_per_capita.min() > 0
    assert panel.hdi.between(0,1).all()
    x, y = transform(panel), panel.hdi.to_numpy()
    dev, test = next(GroupShuffleSplit(n_splits=1,test_size=.2,random_state=42).split(x,y,panel.iso3))
    tr, va = next(GroupShuffleSplit(n_splits=1,test_size=.25,random_state=43).split(x[dev],y[dev],panel.iloc[dev].iso3))
    train, valid = dev[tr], dev[va]
    groups = {name: sorted(panel.iloc[idx].iso3.unique().tolist()) for name,idx in [('train',train),('validation',valid),('test',test)]}
    assert not set(groups['train']) & set(groups['validation'])
    assert not (set(groups['train']) | set(groups['validation'])) & set(groups['test'])
    models = {
        'Linear regression': LinearRegression(),
        'Decision tree': DecisionTreeRegressor(max_depth=12,min_samples_leaf=3,random_state=42),
        'Random forest': RandomForestRegressor(n_estimators=96,max_depth=14,min_samples_leaf=2,random_state=42,n_jobs=1),
        'Extra Trees': ExtraTreesRegressor(n_estimators=96,max_depth=14,min_samples_leaf=2,random_state=42,n_jobs=1),
    }
    comparison = []
    for name,model in models.items():
        model.fit(x[train],y[train])
        comparison.append(dict(name=name,**metrics(y[valid],model.predict(x[valid]))))
    winner = min(comparison, key=lambda row:row['mae'])['name']
    final = clone(models[winner]).fit(x[dev],y[dev])
    heldout = np.clip(final.predict(x[test]),0,1)
    permutation = permutation_importance(final,x[test],y[test],scoring='neg_mean_absolute_error',n_repeats=8,random_state=42,n_jobs=1)
    temporal_train = np.flatnonzero(panel.year.to_numpy()<=2018)
    temporal_test = np.flatnonzero(panel.year.to_numpy()>2018)
    temporal = clone(models[winner]).fit(x[temporal_train],y[temporal_train])
    artifact = dict(schemaVersion=1,name=winner,features=FEATURES,preprocessing='Natural log of GNI; other features unchanged; complete cases only. Predictions clipped to [0,1].',
                    medians={f:float(panel.iloc[dev][f].median()) for f in FEATURES},
                    ranges={f:[float(panel.iloc[dev][f].min()),float(panel.iloc[dev][f].max())] for f in FEATURES})
    if isinstance(final,LinearRegression):
        artifact.update(kind='linear',coefficients=final.coef_.tolist(),intercept=float(final.intercept_))
    else:
        estimators = final.estimators_ if hasattr(final,'estimators_') else [final]
        artifact.update(kind='trees',trees=[dict(left=e.tree_.children_left.tolist(),right=e.tree_.children_right.tolist(),feature=e.tree_.feature.tolist(),threshold=e.tree_.threshold.tolist(),value=e.tree_.value[:,0,0].tolist()) for e in estimators])
    dump('model.json',artifact)
    # Include held-out cases, reproducible random in-range inputs and split-adjacent inputs.
    rng = np.random.default_rng(42)
    random_rows = pd.DataFrame({f:rng.uniform(*artifact['ranges'][f],size=256) for f in FEATURES})
    boundary_rows = []
    if artifact['kind']=='trees':
        for tree in artifact['trees'][:4]:
            for feature,threshold,left in zip(tree['feature'],tree['threshold'],tree['left']):
                if left == -1: continue
                for offset in [-1e-7,0,1e-7]:
                    row = artifact['medians'].copy()
                    row[FEATURES[feature]] = float(np.exp(threshold+offset) if feature==3 else threshold+offset)
                    boundary_rows.append(row)
                if len(boundary_rows)>=300: break
            if len(boundary_rows)>=300: break
    parity = pd.concat([panel.iloc[test][FEATURES],random_rows,pd.DataFrame(boundary_rows)],ignore_index=True)
    parity_pred = np.clip(final.predict(transform(parity)),0,1)
    dump('parity.json',[dict(input=row,prediction=float(pred)) for row,pred in zip(parity.to_dict('records'),parity_pred)])
    latest = panel[panel.year==2023].copy()
    region_map = dict(AS='Arab States',EAP='East Asia & Pacific',ECA='Europe & Central Asia',LAC='Latin America & Caribbean',SA='South Asia',SSA='Sub-Saharan Africa')
    regions = countries.set_index('iso3').region.to_dict()
    records = []
    for row in latest.to_dict('records'):
        row['region'] = region_map.get(regions.get(row['iso3']), 'Other / not assigned')
        row['history'] = panel[panel.iso3==row['iso3']][['year','hdi']].to_dict('records')
        records.append(row)
    dump('countries.json',records)
    # Audit the original generator without deserializing the old pickle.
    old = pd.read_csv(ROOT / 'data/raw/raw_hdi_data.csv')
    old_x = transform(old)
    oi, ot = train_test_split(np.arange(len(old)),test_size=.2,random_state=42)
    gi, gt = next(GroupShuffleSplit(n_splits=1,test_size=.2,random_state=42).split(old_x,old.hdi,old.real_country_name))
    synthetic_audit = {}
    for name,i,t in [('randomSplit',oi,ot),('familyGroupedSplit',gi,gt)]:
        estimator = ExtraTreesRegressor(n_estimators=96,random_state=42,n_jobs=1).fit(old_x[i],old.hdi.iloc[i])
        synthetic_audit[name] = metrics(old.hdi.iloc[t],estimator.predict(old_x[t]))
    synthetic_audit['formula'] = metrics(old.hdi,formula(old))
    report = dict(name=winner,dataset='UNDP Human Development Report 2025',source=SOURCE,sourcePage='https://hdr.undp.org/data-center/documentation-and-downloads',
        sha256=hashlib.sha256(raw_path.read_bytes()).hexdigest(),rows=len(panel),countries=int(panel.iso3.nunique()),latestCountries=len(latest),years=[1990,2023],droppedRows=original_count-len(panel),
        versions=dict(python=sys.version.split()[0],numpy=np.__version__,pandas=pd.__version__,sklearn=sklearn.__version__),
        seed=42,validationSeed=43,selection='Lowest country-disjoint validation MAE; refit on train + validation; test countries remain unseen.',
        split=dict(train=len(train),validation=len(valid),test=len(test),groups=groups),comparison=comparison,
        test=metrics(y[test],heldout),formula=metrics(y[test],formula(panel.iloc[test])),
        temporal=dict(trainRows=len(temporal_train),testRows=len(temporal_test),**metrics(y[temporal_test],temporal.predict(x[temporal_test]))),
        importance=[dict(feature=f,value=float(v),std=float(s)) for f,v,s in zip(FEATURES,permutation.importances_mean,permutation.importances_std)],
        residuals=[dict(actual=float(a),predicted=float(p)) for a,p in zip(y[test][::5],heldout[::5])],
        syntheticAudit=synthetic_audit,parityCases=len(parity),
        limitations=['HDI is defined by these same four components. This is index reconstruction, not independent forecasting.',
        'Country grouping reduces repeated-country leakage; related economies and temporal dependence remain.',
        'Temporal evaluation supplies contemporaneous indicators and is not a future forecast.',
        'Complete-case filtering may bias coverage; the source contains estimates and revisions.',
        'Feature replacement sensitivity is not causal, additive attribution or a confidence interval.'])
    dump('evaluation.json',report)
    panel.to_csv(ROOT / 'data/processed/undp_panel.csv',index=False)
    print(json.dumps({k:report[k] for k in ['name','rows','countries','latestCountries','test','formula','temporal','syntheticAudit','versions','parityCases']},indent=2))

if __name__=='__main__':
    run()
