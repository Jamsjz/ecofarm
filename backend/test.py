from chat_service import predict_disease
from io import BytesIO

byteimage = BytesIO(open("test.jpg", "rb").read())
print(predict_disease(byteimage))