from faker import Faker
from flask import Flask
import json

fake = Faker(['zh_TW'])
Faker.seed(0)
fake.seed_instance(0)
fake.seed_locale('zh_TW', 4000)

app = Flask(__name__)


def get_syth_data():
    temp = {}
    for _ in range(30):
        arr = []
        arr.append(fake.name())
        arr.append(fake.ascii_free_email())
        arr.append(fake.phone_number())
        temp[_] = arr
    return temp


@app.route('/')
def index():
    return json.dumps(get_syth_data())


app.run()
# print(get_syth_data())
