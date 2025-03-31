import https from 'https';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from 'path';

const s3_client = new S3Client({ region: "us-east-1" });

async function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(`Download failed with status code: ${response.statusCode}`);
                return;
            }

            const file = fs.createWriteStream(destination);
            response.pipe(file);

            file.on('finish', () => {
                file.close(resolve);
            });

            file.on('error', (err) => {
                fs.unlinkSync(destination);
                reject(err);
            });

            response.on('error', (err) => {
                fs.unlinkSync(destination);
                reject(err);
            });
        }).on('error', (err) => {
            fs.unlinkSync(destination);
            reject(err);
        });
    });
}
  

async function extractZip(zipPath, extractPath) {
    return new Promise((resolve, reject) => {
      try {
        const zip = new AdmZip(zipPath);
        if (!fs.existsSync(extractPath)) {
            // console.log(`Creating directory ${extractPath}`);
            fs.mkdirSync(extractPath, { recursive: true });
        }
        zip.extractAllTo(extractPath, true);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

async function sendToS3(filePath, s3Key, bucketName) {
	try {
        const fileStream = fs.createReadStream(filePath);
		let uploadParams = {
			Bucket: bucketName,
			Key: s3Key,
			Body: fileStream,
		};

		const command = new PutObjectCommand(uploadParams);
		const response = await s3_client.send(command);
		// console.log("S3 response:", response.$metadata.httpStatusCode);
	}
	catch (err) {
		console.log("S3 Error: ", err);
	};
}

async function uploadExtractedFilesToS3(extractPath,bucketName,s3FolderPath) {
    const files = fs.readdirSync(extractPath);
  
    for (const file of files) {
        const filePath = path.join(extractPath, file);
        const s3Key = s3FolderPath ? `${s3FolderPath}/${file}` : file;
        try {
            await sendToS3(filePath, s3Key, bucketName);
            console.log(`Uploaded ${file} to ${s3Key}.`);
        } catch {
            console.error(`${file} was not uploaded to S3.`);
        };
    };
  }

export const handler = async(event) => {
    const fileUrl = 'https://data.trilliumtransit.com/gtfs/asheville-nc-us/asheville-nc-us.zip';
    const tempZipPath = '/tmp/temp-asheville-nc-us.zip';
    const extractPath = '/tmp/temp-extracted';
    const bucketName = 'avl-bus-schedule';
    const s3FolderPath = 'gtfs'

    try {
        await downloadFile(fileUrl,tempZipPath);
        await extractZip(tempZipPath, extractPath);
        await uploadExtractedFilesToS3(extractPath, bucketName,s3FolderPath);

        fs.unlinkSync(tempZipPath);
        fs.rmSync(extractPath, { recursive: true, force: true }); // Remove extracted folder
        console.log('Files downloaded, extracted, and uploaded to S3.');
    } catch (error) {
        console.error('Error:', error);
        if (fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
        if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true, force: true });
    };
}