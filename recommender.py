import pandas as pd
import numpy as np
import multiprocessing as mp
import math
import time

from sklearn.metrics.pairwise import cosine_similarity

activity = pd.read_csv('activity_data.csv')
activity = activity.iloc[:1000]
hotel = pd.read_csv('hotel_data.csv')

print('Calculating uniques')
user_ids = activity.user_id.unique()
hotel_ids = hotel.hotel_id.unique()

print('Building engagement placeholder thing')
engagement = pd.DataFrame(0, index=user_ids, columns=hotel_ids)
print(engagement)
print('Done')

print('???')
start = time.time()
for i, entry in activity.iterrows():
    engagement.loc[entry.user_id,entry.hotel_id] = 1
end = time.time()
print(end - start)

hotel_similarities = cosine_similarity(engagement.transpose())

from sklearn.decomposition import NMF
n = 5
model = NMF(n_components=n, init='random', random_state=0)
W = model.fit_transform(engagement)
H = model.components_
user_hotel_score = np.matmul(W,H)

# check precision by comparing with the actual hotels they picked/viewed/booked/engaged with?
# how do we specify what type of engagement?
#look at the rest of the data to predict one and then compare with actual data 
def top(idx):
    # help
    #print(np.sort(np.trim_zeros(user_hotel_score[idx])))
    trimmedList = np.trim_zeros(user_hotel_score[idx])
    print(trimmedList) 
    print("Max of trimmed list", max(trimmedList))
    argSorted = np.argsort(trimmedList)
    top3 = argSorted[-3:]
    for i in top3: 
        print(trimmedList[i])
        #can use index to get names of the hotels too... 
        
    
    

print(top(0))

print('Profit')
