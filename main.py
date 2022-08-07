from faker import Faker
from flask import Flask, render_template
import json

fake = Faker(['zh_TW'])
Faker.seed(0)
fake.seed_instance(0)
fake.seed_locale('zh_TW', 4000)

app = Flask(__name__)


def get_syth_data():
    data = []
    for _ in range(36):
        temp = {}
        temp['id'] = _
        temp['name'] = fake.name()
        temp['phone'] = fake.phone_number()
        temp['email'] = fake.ascii_free_email()
        temp['used'] = False
        data.append(temp)
    return data


@app.route('/get_data')
def get_data():
    return json.dumps(get_syth_data())


@app.route('/')
def index():
    return render_template('index.html')


app.run()
# print(get_syth_data())
