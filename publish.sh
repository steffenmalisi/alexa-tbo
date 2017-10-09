#!/bin/bash
rm index.zip
cd src
zip -r ../index.zip *
cd ..
aws lambda update-function-code --function-name dealer-tbo --zip-file fileb://index.zip