import pandas
import os
import sys
import numpy as np
import pickle
import scipy.io as sio
from datetime import date as DateTimeDate
from sklearn.preprocessing import MinMaxScaler,StandardScaler
from sklearn.utils.extmath import cartesian
import datetime
import ts_cluster
from sklearn.utils.extmath import cartesian
from sklearn.metrics import silhouette_score
from sklearn.metrics.pairwise import pairwise_distances
import kmedoids
from mlpy.dtw import dtw_std
from tslearn.barycenters import euclidean_barycenter, dtw_barycenter_averaging, softdtw_barycenter

def createFolder(directory):
    try:
        if not os.path.exists(directory):
            os.makedirs(directory)
    except OSError:
        print ('Error: Creating directory. ' +  directory)




folder_name = 'clusters'
createFolder(folder_name)

datpv = pandas.read_pickle("dataport_Austinusers_2015Oct_withoutPV.pkl")
dataids = datpv.dataid.unique()

#Data preprocessing

dat_length = len(dataids)
intervals = cartesian([range(24),[0,15,30,45]])
dat = np.zeros((dat_length,31,96))
for i in range(dat_length):
    temp1 = datpv.loc[datpv['dataid'] == dataids[i]]['use']
    for day in range(31):
        for j in range(len(intervals)):
            try:
                dat[i,day,j] = temp1.loc[datetime.datetime(2015,10,day+1,intervals[j,0],intervals[j,1])]
            except KeyError:
                dat[i,day,j] = np.nan

dat_shifted = np.zeros((dat_length,30,96))
dat_shifted_norm = np.zeros((dat_length,30,96))
dat_shifted[:,:,:76] = dat[:,:30,20:]
dat_shifted[:,:,76:] = dat[:,1:,:20]
dat_shifted_nan = np.ones((dat_length,30), dtype=bool)


#Normalization

for i in range(dat_length):
    scaler = MinMaxScaler((0,0.99999))
    proceed = False
    for j in range(30):
        if(len(np.where(np.isnan(dat_shifted[i,j]))[0])>0):
            dat_shifted_nan[i,j] = 0
            dat_shifted_norm[i,j] = np.zeros(96)
        else:
            proceed = True
    if(proceed):
        dat_shifted_norm[i,dat_shifted_nan[i]] = scaler.fit_transform(dat_shifted[i,dat_shifted_nan[i]].T).T

dat_shifted[np.isnan(dat_shifted)] = 0

Oct2015_weekdays = np.zeros(30,dtype=bool)
Oct2015_weekends = np.zeros(30,dtype=bool)
for i in range(30):
    if(i%7 == 1 or i%7 == 2 or i%7 == 3):
        Oct2015_weekends[i]=1
    else:
        Oct2015_weekdays[i]=1

time_period = range(96)

dat_dbamean = np.zeros((dat_length,96))
for i in range(dat_length):
    dba_bar = softdtw_barycenter(dat_shifted_norm[i,:,:], gamma=0.1, max_iter=100)
    dat_dbamean[i,:] = dba_bar.ravel()
pickle.dump(dat_dbamean, open(folder_name+'/dataport_AustinnoPVusers_dbaMean_Oct2015.pkl','w'))
pickle.dump(dat_shifted, open(folder_name+'/dataport_AustinnoPVusers_notScaled_Oct2015.pkl','w'))
pickle.dump(dat_shifted_norm, open(folder_name+'/dataport_AustinnoPVusers_minmaxScaled_Oct2015.pkl','w'))
pickle.dump(dat_shifted_nan, open(folder_name+'/dataport_AustinnoPVusers_nanValues_Oct2015.pkl','w'))

for warping_penalty in [1.0]:
    for cluster_no in [5]:
        for window_size in [3]:

            df = pandas.DataFrame(dat_dbamean)
            dtw_metric = lambda x, y: dtw_std(x, y,
                                                dist_only=True,
                                                constraint="slanted_band",
                                                k=window_size,
                                                warping_penalty=warping_penalty)

            D = pairwise_distances(df, metric=dtw_metric)
            M, assignments = kmedoids.kMedoids(D, cluster_no)
            labels = np.zeros(D.shape[0])
            for c in assignments.keys():
                assignList = assignments[c]
                labels[assignList] = c
            silhouette = silhouette_score(D,labels,metric='precomputed')

            pickle.dump(assignments,open(folder_name+'/dataport_DTWcluster.pkl','w'))

            f = open(folder_name+'/dataport_DTWcluster.csv','w')
            labels = np.zeros(dat_length*15)
            for i in assignments.keys():
                tmp = assignments[i]
                for j in range(len(tmp)):
                    labels[tmp[j]] = i
            for i in range(dat_length*15):
                f.write(str(i)+','+str(labels[i])+','+str(dataids[int(i/15)]))
                f.write('\n')
            f.close()
