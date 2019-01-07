import sys
import json
from flask import Flask

app = Flask(__name__, static_url_path='/static')

sys.path.append('code')

from QP_disaggregation import *

user_data = {}
centroid_data = None
num_users = 0

@app.route("/run")
def go():
    print 'this works!'
    user_data, user_list, centroid_data = run()
    # for user_num in users:
    #     file_path = 'code/disaggregation/disaggregation_user' + str(user_num) + '.json'
    #     user_data = json.loads(codecs.open(file_path, 'r', encoding='utf-8').read())
    return json.dumps(user_data)

@app.route("/user/<num>")
def getUserData():
    if (num in user_data):
        return user_data[num]
    else:
        return 'No data found'

@app.route("/")
def index():
    return app.send_static_file('index.html')


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)
