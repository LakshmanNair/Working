// Retrieves current time from the header, else, generates the current time.
function requestTime(req, res, next) {

  // TODO: Uncomment when no longer using the autotester
  const dateStr = req.headers['x-date'];
  if (dateStr) {
    const datum = new Date(dateStr);
    if (isNaN(datum.getTime())) {
      return res.status(400).json({ error: "Invalid x-date header" });
    }
    req.requestDate = datum;
  } else {  // Don't think this case will ever apply considering the autotests, here because why not.
    req.requestDate = new Date();
  }

  next();
};

module.exports = { requestTime };
