import pandas as pd
import numpy as np
import multiprocessing as mp
import os.path
import math
import time
import sys
import pickle

from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import NMF

n_items = 5000
bar_width = 50
bar_interval = n_items // bar_width

activity = pd.read_csv('activity_data.csv')
activity = activity.iloc[:n_items]
hotel = pd.read_csv('hotel_data.csv')

user_ids = activity.user_id.unique()
hotel_ids = hotel.hotel_id.unique()


engagement = None
if not os.path.isfile('engagement.pickle'):
    sys.stdout.write("Building Engagement Matrix... [%s]" % (" " * bar_width))
    sys.stdout.flush()
    sys.stdout.write("\b" * (bar_width+1))

    start = time.time()

    engagement = pd.DataFrame(0, index=user_ids, columns=hotel_ids)
    for i, entry in activity.iterrows():
        if i % bar_interval == 0:
            sys.stdout.write('#')
            sys.stdout.flush()
        engagement.loc[entry.user_id,entry.hotel_id] = 1
    sys.stdout.write('\n')

    end = time.time()
    print("Finished in ", end - start, "s\n")

    engagement.to_pickle('engagement.pickle')

else:
    engagement = pd.read_pickle('engagement.pickle')



hotel_similarities = cosine_similarity(engagement.transpose())
n = 15
model = NMF(n_components=n, init='random', random_state=0)
W = model.fit_transform(engagement)
H = model.components_
user_hotel_score = np.matmul(W,H)



# check precision by comparing with the actual hotels they picked/viewed/booked/engaged with?
# how do we specify what type of engagement?
#look at the rest of the data to predict one and then compare with actual data
def top(idx, n):
    user_id = engagement.index.values.tolist()[idx]
    print("Top Hotels for user_id" , user_id)

    argSorted = np.argsort(user_hotel_score[idx])
    top_n = argSorted[-n:]

    for i in range(len(top_n)):

        reverseIterTop_NIndex = len(top_n)-i-1

        cosineSimilarityTop_NIndex = top_n[reverseIterTop_NIndex]
        cosineSimilarityValue = user_hotel_score[idx][cosineSimilarityTop_NIndex]

        hotel_id = engagement.columns.values.tolist()[cosineSimilarityTop_NIndex]
        hotel_row = hotel.loc[hotel.hotel_id == hotel_id]

        print(str(i + 1) + ")", hotel_row.hotel_name.item(), "(" + str(cosineSimilarityValue) + ")")
        #print(activity.loc[activity.hotel_id == hotel_id])
        #print(activity.loc[activity.user_id == user_id])



top(14, 5)
