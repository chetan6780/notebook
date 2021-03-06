const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'chetanIsGood$boy';

// ROUTE 1: Create a user using : POST "/api/auth/createuser". No login required.
router.post('/createuser', [
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 5 characters').isLength({ min: 5 })],
    async (req, res) => {
        const errors = validationResult(req);
        let success = false;
        // If there are errors, return bad request and errors
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: success, errors: errors.array() });
        }

        try {
            // check wether the user with this email already exists
            let user = await User.findOne({ email: req.body.email });
            if (user) {
                return res.status(400).json({ success: success, error: 'Sorry a user with this email already exists. ' })
            }

            const salt = await bcrypt.genSalt(10);
            const secPass = await bcrypt.hash(req.body.password, salt);

            // Create new user;
            user = await User.create({
                name: req.body.name,
                password: secPass,
                email: req.body.email,
            });

            const data = {
                user: {
                    id: user.id
                }
            }
            const authtoken = jwt.sign(data, JWT_SECRET);
            success = true;
            res.json({ success, authtoken });
        }
        catch (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        }
    }
);

// ROUTE 2: Autheticate a user using : POST "/api/auth/login". No login required.
router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be empty').exists(),],
    async (req, res) => {
        const errors = validationResult(req);
        let success = false;

        // If there are errors, return bad request and errors
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: success, errors: errors.array() });
        }

        const { email, password } = req.body;
        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ success: success, error: 'Please try to login with correct credentials' });
            }

            const passwordCompare = await bcrypt.compare(password, user.password);
            if (!passwordCompare) {
                return res.status(400).json({ success: success, error: 'Please try to login with correct credentials' });
            }

            const data = {
                user: {
                    id: user.id
                }
            }
            const authtoken = jwt.sign(data, JWT_SECRET);
            success = true;
            res.json({ success, authtoken });

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Internal server error');
        }
    }
);

// ROUTE 3: Get logged in user details : POST "/api/auth/getuser". Login required.
router.post('/getuser', fetchuser, async (req, res) => {
    try {
        userId = req.user.id;
        const user = await User.findById(userId).select('-password');
        res.send(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;