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
from tslearn.barycenters import euclidean_barycenter, dtw_barycenter_averaging, softdtw_barycenter

folder_name = 'clusters'
dat_shifted_norm = pickle.load(open(folder_name+'/dataport_AustinnoPVusers_minmaxScaled_Oct2015.pkl','r'))

Oct2015_weekdays = np.zeros(30,dtype=bool)
Oct2015_weekends = np.zeros(30,dtype=bool)
for i in range(30):
    if(i%7 == 1 or i%7 == 2 or i%7 == 3):
        Oct2015_weekends[i]=1
    else:
        Oct2015_weekdays[i]=1


day_count = 30

intervals = cartesian([range(24),[0,15,30,45]])

for averaging_gamma in [0.1, 1.0, 10.0]:
    gamma,warping_penalty,cluster_no,window_size = [0.01,0.01,5,1]
    assignments = pickle.load(open(folder_name+'/dataport_DTWcluster.pkl','r'))

    centroid_dat = np.zeros((cluster_no,day_count,96))
    for c in assignments.keys():
        assignList = assignments[c]
        if(len(assignList)==0):
            continue
        else:
            for d in range(day_count):
                dba_bar = softdtw_barycenter(dat_shifted_norm[assignList,d], gamma=averaging_gamma, max_iter=100)
                centroid_dat[c,d] = dba_bar.ravel()

    pickle.dump(centroid_dat,open(folder_name+'/dataport_sdtwba.pkl','w'))
