// module.exports = (err, req, res, next) => {
//   // console.log(err.stack);
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || "error";

//   if(process.env.NODE_ENV === "development"){
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message,
//       error: err,
//       stack: err.stack,
//     });
//   } else if(process.env.NODE_ENV === "production"){
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message,
//     });
//   }
// };

// PART 2--------------------
const AppError = require("../Utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message,400);
};

const handleDuplicateFieldsBD = (err) => {
  const value = err.errmsg.match(/(?<=")(?:\\.|[^"\\])*(?=")/);
  const message = `Duplicate field values ${value}. Please use another value`;
  return new AppError(message,400);
};

const handleJWTError = () => new AppError("Invalid Token, Log In Again",401);

const handleJWTExpiredError = () => new AppError("Session Expired, Log In Again",401);

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid Input Data. ${errors.join(". ")}`;
  return new AppError(message,400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorPro = (err, res) => {
  if (err.isOperational){
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log(err);
    res.status(500).json({
      status: "error",
      message: "Something gone wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if(process.env.NODE_ENV === "development"){
    sendErrorDev(err,res);
  } else if(process.env.NODE_ENV === "production"){

    let error = {...err};
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsBD(error);
    if (error.name === "ValidationError") error = handleValidationError(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorPro(error,res);
  }
  next();
};