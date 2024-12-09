const { Router } = require('express');

const s3 = require('../../utils/fileAccess/s3Wrapper.js');
const rabbit = require('../../utils/rabbit.js');
const { fileAccessMethodController } = require('../../utils/fileAccess/fileAccessMethodController.js');


/**
 * Delete File
 */
const router = Router();

router.post("/:folderName", async (req, res) => {

    const folderName = req.params.folderName;
    const method = req.headers.method;
    
    try {
        await fileAccessMethodController.createFolder(folderName);
        res.status(200).send('Folder created');
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
  });

module.exports = router;