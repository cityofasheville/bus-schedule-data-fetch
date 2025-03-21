Bus-schedule-data-fetch downloads a zip file from Trillium Transit (vendor), extracts it, and uploads the files to S3.  It is a Lambda in custom-asheville that is run periodically.

The comma-delimited files contain the city's bus schedule data and are loaded into the data library from S3 via Bedrock.

The intention is to eventually display this data on the city website, as the current schedules are in pdf format.

Bus Schedule zip file permanent link: https://data.trilliumtransit.com/gtfs/asheville-nc-us/asheville-nc-us.zip

Transit Schedule site: https://www.ashevillenc.gov/service/transit-maps-schedules/

AWS S3 bucket: https://us-east-1.console.aws.amazon.com/s3/buckets/avl-bus-schedule?region=us-east-1&bucketType=general&tab=objects
