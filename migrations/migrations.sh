[ -z "${ZOMBI_DB_URL}" ] && echo "Environment not set!" && exit 1

# SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# To run locally (without Docker)
# BIN=${SCRIPT_DIR}/bin/dbmate
# MIGRATIONS_DIR=${SCRIPT_DIR}/migrations
# MIGRATIONS_TABLE=schema_migrations
# ${BIN} --url=${ZOMBI_DB_URL} --migrations-dir=${MIGRATIONS_DIR} --migrations-table=${MIGRATIONS_TABLE} "$@"

SCRIPT_FULL_PATH=$(dirname "$0")

if [ $SCRIPT_FULL_PATH != "." ]; then
    echo "Please run this script inside the 'migrations' directory"
    echo "Hint: maybe you need to run 'cd migrations' before running this script"
    exit 1
fi

export DBMATE_MIGRATIONS_DIR=db/migrations
export DBMATE_MIGRATIONS_TABLE=migrations.schema_migrations
export DBMATE_SCHEMA_FILE=db/db_schema.sql
export DBMATE_NO_DUMP_SCHEMA=false
export DBMATE_WAIT=true
export DBMATE_WAIT_TIMEOUT=10s

docker run --rm --network=host -v "$(pwd)/db:/db" \
    -e DATABASE_URL=${ZOMBI_DB_URL}?sslmode=disable \
    -e DBMATE_MIGRATIONS_DIR=${DBMATE_MIGRATIONS_DIR} \
    -e DBMATE_MIGRATIONS_TABLE=${DBMATE_MIGRATIONS_TABLE} \
    -e DBMATE_SCHEMA_FILE=${DBMATE_SCHEMA_FILE} \
    -e DBMATE_NO_DUMP_SCHEMA=${DBMATE_NO_DUMP_SCHEMA} \
    -e DBMATE_WAIT=${DBMATE_WAIT} \
    -e DBMATE_WAIT_TIMEOUT=${DBMATE_WAIT_TIMEOUT} \
    -u $(id -u ${USER}):$(id -g ${USER}) \
    ghcr.io/amacneil/dbmate:1 "$@"

