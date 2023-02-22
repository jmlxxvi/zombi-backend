[ -z "${ZOMBI_LAMBDA_NAME_MICROSERVER}" ] && echo "Zombi environment not set!" && exit 2

export AWS_PAGER=""

DATETIME=$(date +"%Y_%m_%d.%H_%M_%S")

if [ -z "$1" ]; then
    LAMBDA_TO_UPLOAD="all"
else 
    LAMBDA_TO_UPLOAD=$1
fi

CODE_FILE=${DATETIME}_ZOMBI_LAMBDA_CODE.zip

echo "Code file is ${CODE_FILE}"

echo "Building code..."
npm run build && \
cd build && \
zip -q -r ${CODE_FILE} . && \
aws s3 cp ./${CODE_FILE} s3://${ZOMBI_CODE_BUCKET}/ --exclude "*" --include "*.zip" && \
rm -f ${CODE_FILE} && \
cd ..

echo "Updating lambdas..."

for LAMBDA_SHORT_NAME in microserver queue reactor websockets files; do
    case ${LAMBDA_SHORT_NAME} in
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

    if [ "${LAMBDA_SHORT_NAME}" = "${LAMBDA_TO_UPLOAD}" ] || [ "${LAMBDA_TO_UPLOAD}" = "all" ]; then
        echo "Updating function ${LAMBDA_NAME} from bucket ${ZOMBI_CODE_BUCKET}"
        aws lambda update-function-code --function-name ${LAMBDA_NAME} --s3-bucket ${ZOMBI_CODE_BUCKET} --s3-key ${CODE_FILE}
    else
        echo "Skipping configuration of (${LAMBDA_SHORT_NAME}) ${LAMBDA_NAME}"
    fi
done 



