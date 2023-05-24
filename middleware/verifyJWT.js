const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    //standard for authorization header, to start with 'Bearer' followed by a space, then token
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err){
                return res.status(403).json({ message: 'Forbidden' });
            }

            req.user = decoded.UserInfo.username;

            next();
        }
    )
}

module.exports = verifyJWT ;