# Proto definitions are *not* generated on the fly, they must be kept up to 
# date by running this.

protoc --plugin="./node_modules/.bin/protoc-gen-ts_proto" \
  --ts_proto_out="./app/src/lib" \
  --go_out="./proto/go" \
  "./proto/bright_stars.proto" \
  "./proto/asteroids.proto"
