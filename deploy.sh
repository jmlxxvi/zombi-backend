
[ -z "${AWS_ACCESS_KEY_ID}" ] && echo "AWS credentials not set!" && exit 1

[ -z "${ZOMBI_LAMBDA_NAME_MICROSERVER}" ] && echo "Zombi environment not set!" && exit 2

# cd "${BASH_SOURCE%/*}/" || exit 

# pwd

DATETIME=$(date +"%Y_%m_%d.%H_%M_%S")

if [ -n "$1" ] 
then 
    LAMBDA_SHORT_NAME="microserver"
else 
    LAMBDA_SHORT_NAME=$1
fi

case LAMBDA_SHORT_NAME in
"microserver")
    LAMBDA_NAME=${ZOMBI_LAMBDA_NAME_MICROSERVER}
    ;;
"queue")
    LAMBDA_NAME=${ZOMBI_LAMBDA_NAME_QUEUE}
    ;;
"reactor")
    LAMBDA_NAME=${ZOMBI_LAMBDA_NAME_REACTOR}
    ;;
"websockets")
    LAMBDA_NAME=${ZOMBI_LAMBDA_NAME_WEBSOCKETS}
    ;;
"files")
    LAMBDA_NAME=${ZOMBI_LAMBDA_NAME_FILES}
    ;;
esac

# TODO check if LAMBDA_NAME is not empty

CODE_FILE=${DATETIME}_${LAMBDA_NAME}.zip

echo "Code file is ${CODE_FILE}"

echo "Uploading code for ${LAMBDA_NAME}..."
npm run build && \
cd build && \
zip -q -r ${CODE_FILE} . && \
aws s3 cp ./${CODE_FILE} s3://${AWS_CONFIG_CODE_BUCKET_NAME}/ --exclude "*" --include "*.zip" && \
rm -f ${CODE_FILE} && \
cd ..

echo "Updating function ${LAMBDA_NAME}..."
aws lambda update-function-code --function-name ${LAMBDA_NAME} --region ${AWS_DEFAULT_REGION} --s3-bucket ${AWS_CONFIG_CODE_BUCKET_NAME} --s3-key ${CODE_FILE}

