from cvxopt import matrix, spmatrix, spdiag, solvers
import pandas
import scipy.io as sio
import sys
import pickle
from scipy.linalg import lstsq
import os
import datetime
import numpy as np
import json

def MASE(y,pred_y):
    T = len(y)
    q = np.zeros(T)
    denominator = np.sum(np.abs(y[1:]-y[:T-1]))
    error = np.sum(np.abs(y-pred_y))
    return ( error / (T/(T-1)*denominator) )


def postOptimizationAdjustment(theta, phi, AMI, centroid_data, R, alpha, beta):
    #centroid_data - K x T matrix, K=number of clusters, T = number of intervals
    l_tmp = np.matmul(centroid_data.T,np.array(theta))
    s_tmp = R*phi
    l = np.zeros(len(l_tmp))
    s = np.zeros(len(s_tmp))
    for t in range(len(AMI)):
        diff = (l_tmp[t]+s_tmp[t]-AMI[t])
        l[t] = l_tmp[t]-diff*alpha
        s[t] = s_tmp[t]-diff*beta
        if(l[t] < 0): #l should be positive
            s[t]+=l[t]
            l[t] = 0
        if(s[t] > 0): #s should be negative
            l[t]+=s[t]
            s[t]=0
    return (l,s)

def ZeroOneNormalization(x):
    minX = np.min(x)
    maxX = np.max(x)
    x_norm = (x-minX)/(maxX-minX)
    return x_norm

def createFolder(directory):
    try:
        if not os.path.exists(directory):
            os.makedirs(directory)
    except OSError:
        print ('Error: Creating directory. ' +  directory)

def addDat(M,I,J,val,x,y):
    M.append(val)
    I.append(x)
    J.append(y)

def run():
    if(len(sys.argv) > 1):
    	_lambda = float(sys.argv[1])
    else:
    	_lambda = 1.0
    if(len(sys.argv) > 3):
        alpha = float(sys.argv[2])
        beta = float(sys.argv[3])
    elif(len(sys.argv) > 2):
        alpha = float(sys.argv[2])
        beta = 1.0 - alpha
    else:
        alpha = 0.2
        beta = 0.8

    # --- EDIT HERE ---
    total_day_count = 28

    params = [[0.001,0.9,0.1]] #best param

    user_data = {}
    user_list = []

    params_count = 0
    for gamma in [1.0]:
        for period_split_no in [2]:
            day_count = total_day_count/period_split_no

            _lambda = params[params_count][0]
            alpha = params[params_count][1]
            beta = params[params_count][2]

            totalMSE = 0
            totalsolarMSE = 0
            totalMASE = 0
            totalsolarMASE = 0

            for offset_no in range(period_split_no):
                offset = offset_no*day_count
                N = 100 #user count
                k = 5 #cluster count
                T = day_count*96 #intervals count
                T_night = day_count*40 #intervals count
                cluster_no=5
                window_size=3


                OUTPUT = True
                DEBUG_TEXT = False

                start_day = offset+2
                end_day = start_day+day_count

                df=pandas.read_pickle('code/irradiance_dataframe_13to15_TX.pkl')
                R = np.array(df['GHI'][datetime.datetime(2015,10,start_day,5,0) : datetime.datetime(2015,10,end_day,4,45)] )
                R = np.repeat(np.array(R),2) #irradiance data is in 30mins interval, AMI in 15mins. repeat irradiance data

                centroid_dat = pickle.load(open('code/clusters/dataport_sdtwba.pkl','r')) #Data starts at 5am

                night_time = np.array(range(40))+56
                centroid_dat_night = np.reshape(centroid_dat[:,start_day-1:end_day-1,night_time],(-1,T_night))
                centroid_dat = np.reshape(centroid_dat[:,start_day-1:end_day-1,:],(-1,T))

                df_PV = pandas.read_pickle("code/dataport_Austinusers_2015Oct_withPV.pkl")
                # print(df_PV)
                dat_PV = df_PV.sort_index().ix[datetime.datetime(2015,10,start_day,5,0) : datetime.datetime(2015,10,end_day,4,45)]
                PV_id = df_PV.dataid.unique()

                folder_name = 'disaggregation'
                createFolder(folder_name)

                if OUTPUT:
                    f = open('code/'+folder_name+'/ErrorSummary.csv','w')
                    f.write('No,UserID,LoadMSE,SolarMSE,LoadMASE,SolarMASE\n')

                usercount = 0
                for user in range(len(PV_id)): #Solve the QP for each user
                    #Use validation set
                    # if np.sum(np.array([744,171,8890,2129,2575,5892,8156,483,4874,7989,2742,781,9134,2925,3829,7719,9248,5218,4193])==PV_id[user])==0:
                    #     continue

                    #Exclude validation set ist
                    if np.sum(np.array([744,171,8890,2129,2575,5892,8156,483,4874,7989,2742,781,9134,2925,3829,7719,9248,5218,4193])==PV_id[user])>0:
                        continue
                    #Exclusion list
                    if np.sum(np.array([8669, 9019, 3044, 9160, 7017, 434, 7794, 3736, 121, 5275, 2365, 2461, 4031, 3935, 379])==PV_id[user])>0:
                        continue

                    # print ("--- user " + str(user) + " ---")
                    # print PV_id[user]
                    # print dat_PV.loc[dat_PV['dataid'] == PV_id[user]]

                    temp = dat_PV.loc[dat_PV['dataid'] == PV_id[user]]['grid']
                    GT_solar = np.array(dat_PV.loc[dat_PV['dataid'] == PV_id[user]]['gen'])
                    GT_load = np.array(dat_PV.loc[dat_PV['dataid'] == PV_id[user]]['use'])
                    centroid = centroid_dat_night #np.zeros((k,T)) #kxT matrix, k clusters, T days of centroids for each cluster
                    AMI_i = temp #np.zeros((T)) #for user i, their T AMI measurements
                    #R = np.zeros((T)) #irradiance data for the T intervals

                    if(len(np.where(np.isnan(AMI_i))[0])>0):
                        continue
                    if(GT_load.shape[0] != 96*day_count):
                        continue

                    GT_load_night = np.reshape(GT_load,(day_count,96))[:,night_time].flatten()
                    # AMI_i_night = np.reshape(AMI_i,(day_count,96))[:,night_time].flatten()
                    AMI_i_night = AMI_i.values.reshape(day_count, 96)[:,night_time].flatten()

                    x_len = (k+k)

                    P_val = []
                    P_i = []
                    P_j = []

                    q = np.zeros((x_len))
                    X = np.zeros((k,k))  #compute sum of XX^T over time
                    for t in range(T_night): #At time interval t=i
                        X_t = centroid[:,t]

                        X = X + np.matmul(X_t.reshape((-1,1)),X_t.reshape((1,-1)))
                        q[:k] = q[:k] + (-1)*AMI_i_night[t]*X_t
                    for i in range(k):
                        q[k+i]=_lambda
                    q = matrix(q)

                    P = np.zeros((x_len,x_len))
                    P[:k,:k] = X
                    P = matrix(P)

                    # P = .5 * (P + P.T)  # make sure P is symmetric

                    # print 'Form G'
                    G_val = []
                    G_i = []
                    G_j = []
                    for i in range(k):
                        addDat(G_val,G_i,G_j,-1,i,i)

                    for i in range(k):
                        base = k
                        addDat(G_val,G_i,G_j,-1,base+2*i,i)
                        addDat(G_val,G_i,G_j,1,base+2*i+1,i)
                        addDat(G_val,G_i,G_j,-1,base+2*i,base+i)
                        addDat(G_val,G_i,G_j,-1,base+2*i+1,base+i)
                    G = spmatrix(G_val,G_i,G_j,(x_len+k,x_len))

                    h = matrix(np.zeros((x_len+k)))



                    solvers.options['show_progress'] = False
                    x = solvers.qp(P, q, G, h)['x']

                    load = np.zeros((T_night))
                    X = centroid[:,:]
                    load = np.matmul(X.T,np.array(x[:k]))

                    loadMSE = np.mean(np.square(load-GT_load))
                    if DEBUG_TEXT:
                        print 'load MSE:',loadMSE
                        print x[:k]
                    theta = np.array(x[:k]).flatten()


                    #Find phi

                    X = centroid_dat[:,:]
                    load = np.matmul(X.T,np.array(x[:k]))
                    target_solar = np.array(AMI_i).flatten()[R != 0] - np.array(load).flatten()[R != 0]

                    X = R[R != 0,np.newaxis]
                    phi, res, rnk, singular = lstsq(X, target_solar)
                    solar_tmp = R*phi[0]
                    solarMSE = np.mean(np.square(solar_tmp-GT_solar))
                    if DEBUG_TEXT:
                        print 'solar MSE:',solarMSE

                    # if OUTPUT:
                        # sio.savemat(folder_name+'/disaggregation_Austinuser'+str(user)+'_'+str(period_split_no)+'_'+str(offset_no)+'_gamma'+str(gamma)+'_Oct3_30_night.mat',{'l_night':load, 'true_l_night':GT_load_night, 'true_l':GT_load, 'AMI':np.array(AMI_i), 'centroids':centroid_dat, 's_night':solar_tmp, 'true_s':GT_solar})

                    centroid = centroid_dat

                    load,solar = postOptimizationAdjustment(theta, phi[0], AMI_i, centroid_dat, R, alpha,beta)

                    loadMSE = np.mean(np.square(load-GT_load))
                    solarMSE = np.mean(np.square(solar+GT_solar))
                    loadMASE = MASE(GT_load,load)
                    solarMASE = MASE(GT_solar,-solar)

                    totalMSE += loadMSE
                    totalsolarMSE += solarMSE
                    totalMASE += loadMASE
                    totalsolarMASE += solarMASE

                    load_list = load.tolist()
                    GT_load_list = GT_load.tolist()
                    solar_list = solar.tolist()
                    GT_solar_list = GT_solar.tolist()
                    temp = [pandas.Series(load).to_json(orient='values'),
                            pandas.Series(GT_load).to_json(orient='values'),
                            pandas.Series(solar).to_json(orient='values'),
                            pandas.Series(GT_solar).to_json(orient='values'),
                            pandas.Series(AMI_i).to_json(orient='values')]

                    user_data[user] = temp
                    user_list.append(user)

                    usercount += 1

                    if OUTPUT:
                        f.write(str(user)+','+str(PV_id[user])+','+str(loadMSE)+','+str(solarMSE)+','+str(loadMASE)+','+str(solarMASE)+'\n')
                        # user_filename = 'code/' + folder_name + '/disaggregation_user' + str(user)
                        # sio.savemat(user_filename + '.mat',{'l':load,'s':solar,'true_s':GT_solar, 'true_l':GT_load, 'AMI':np.array(AMI_i), 'centroids':centroid_dat})
                        # user_filename = './code/json_disag/disaggregation_user' + str(user) + '.json'
                        # json.dump(temp, codecs.open(user_filename + '.json', 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True, indent=4)
                        # with open(user_filename, 'w') as outfile:
                        #     print 'Created file for user' + str(user)
                        #     json.dump(temp, outfile, indent=4)
                        # plot load and true_l are they close
                        # solar and true solar in same plot
                if OUTPUT:
                    f.close()

            totalMSE /= (usercount*period_split_no)
            totalsolarMSE /= (usercount*period_split_no)
            totalMASE /= (usercount*period_split_no)
            totalsolarMASE /= (usercount*period_split_no)
            return user_data, user_list, centroid_dat.tolist()
            # print gamma, period_split_no, _lambda, alpha, beta, totalMSE, totalsolarMSE, totalMSE+totalsolarMSE, totalMASE, totalsolarMASE, totalMASE+totalsolarMASE
            # return {users:users, cent_data: }
