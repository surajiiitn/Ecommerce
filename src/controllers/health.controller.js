const health = (req,res) => {
    res.status(200).json({ 
        status: 'success',
        message: 'API is healthy and running smoothly',
        timestamp : new Date(),
        uptime : process.uptime()
    });
}

const sayHello = (req,res) =>{
    console.log("Hello from the server!");
    res.status(200).json({
        status: 'success',
        message: 'Hello from the server!'
    });
}

module.exports = { health, sayHello };