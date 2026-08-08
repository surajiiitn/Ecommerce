const authorize = (roles) => {
    return async (req,res,next) => {
        try{
            if(!req.user){
                return res.status(403).json(
                    {
                        success : false,
                        message : "Not authorized"
                    }
                )
            }

            if(req.user.role !== "admin"){
                return res.status(403).json(
                    {
                        success : false,
                        message : "User is not admin"
                    }
                )
            }

            next();

        }catch(err){
            return res.status(500).json(
                {
                    success : false,
                    message : "Internal server error"
                }
            )
        }
    }
}

module.exports = {
    authorize
}