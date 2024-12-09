const { Router } = require('express');

const s3 = require('../../utils/fileAccess/s3Wrapper.js');
const rabbit = require('../../utils/rabbit.js');


/**
 * Delete File
 */
const router = Router();

router.delete('/:fileName', async (req, res) => {
    console.info(`Deleting file: ${req.params.fileName} from S3 Bucket ${process.env.AWS_S3_BUCKET}`);
    const fileName = req.params.fileName;
    
    try {
        // have to check if file exists before deleting because only get 204 after delete regardless of if file exists
        const fileExists = await s3.checkFilesExists(process.env.AWS_S3_BUCKET, fileName)
        if (!fileExists) {
            res.status(404).send('File not found');
            return;
        }
        
        await s3.deleteFile(process.env.AWS_S3_BUCKET, fileName);
        await rabbit.sendDeleteThumbnailMessage(process.env.AWS_S3_BUCKET, fileName);
        res.status(200).send('File deleted');

    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    } finally {
    }
    console.info(`File ${fileName} deletion from S3 Bucket ${process.env.AWS_S3_BUCKET} completed`);
});

module.exports = router;