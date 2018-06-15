const router = require('express').Router();
const passport = require('passport');
const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const User = mongoose.model('User');
const auth = require('../auth');

router.post('/', auth.required, (req, res, next) => {
    User.findById(req.payload.id).then((user) => {
        if (!user) {
            return res.sendStatus(401);
        }

        const article = new Article(req.body.article);

        article.author = user;

        return article.save().then(() => {
            console.log(article.author);
            return res.json({article: article.toJSONFor(user)});
        });
    }).catch(next);
});

router.param('article', (req, res, next, slug) => {
    Article.findOne({slug: slug})
        .populate('author')
        .then((article) => {
            if (!article) {
                console.log("article not found");
                return res.sendStatus(404);
            }

            req.article = article;

            return next();
        }).catch(next);
});

router.get('/:article', auth.optional, (req, res, next) => {
    Promise.all([
        req.payload ? User.findById(req.payload.id) : null
    ]).then(results => {
        const user = results[0];

        return res.json({article: req.article.toJSONFor(user)});
    }).catch(next);
});

router.put('/:article', auth.required, (req, res, next) => {
    User.findById(req.payload.id).then((user) => {
        if (req.article.author._id.toString() === req.payload.id.toString()) {
            if (typeof req.body.article.title !== 'undefined') {
                req.article.title = req.body.article.title;
            }

            if (typeof req.body.article.description !== 'undefined') {
                req.article.description = req.body.article.description;
            }

            if (typeof req.body.article.body !== 'undefined') {
                req.article.body = req.body.article.body;
            }

            req.article.save().then(function (article) {
                return res.json({article: article.toJSONFor(user)});
            }).catch(next);
        } else {
            return res.sendStatus(403);
        }
    });
});

router.delete('/:article', auth.required, (req, res, next) => {
    User.findById(req.payload.id).then((user) => {
        if (req.article.author._id.toString() === user._id.toString()) {
            return req.article.remove().then(() => {
                return res.sendStatus(204);
            });
        } else {
            return res.sendStatus(403);
        }
    });
});

module.exports = router;