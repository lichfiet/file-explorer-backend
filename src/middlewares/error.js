module.exports = (err, req, res, next) => {
    if (err) {
      console.error(err.stack);
      res.status(500).send("Something broke! " + err);
    } else {
      next();
    }
  };