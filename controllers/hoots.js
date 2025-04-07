const express = require('express')
const verifyToken = require('../middleware/verify-token')
const Hoot = require('../models/hoot')
const router = express.Router()

router.post("/", verifyToken, async (req, res) => {
    try {

      req.body.author = req.user._id;
      const hoot = await Hoot.create(req.body);
      hoot._doc.author = req.user;
      res.status(201).json(hoot);

    } catch (err) {
      res.status(500).json({ err: err.message });
    }
  });

router.get('/', verifyToken, async (req, res) => {
    try {
        const hoots = await Hoot.find({})

            .populate("author")
            .sort( createAt = "desc" )

        res.status(200).json(hoots)

    } catch (error) {
        res.status(500).json({ err: error.message})
    }
})

router.get('/:hootId', verifyToken, async (req, res) => {
    try{
        const hoot = await Hoot.findById (req.params.hootId).populate([
            'author', 
            'comments.author'
        ])
        res.status(200).json(hoot)
    } catch(error) {
        res.status(500).json({ err: err.message });
    }
})

router.put('/:hootId', verifyToken, async (req,res) => {
    try {
        // Let's start by finding the hoot in question
        const hoot = await Hoot.findById(req.params.hootId)

        //Are we the user who made this hoot?

        if (!hoot.author.equals(req.user._id)) {
            return res.status(403).json({ err: "you're not the author of this hoot"})
        } 

        // If you are the real author, let's update the hoot
        const updatedHoot = await Hoot.findByIdAndUpdate(req.params.hootId, req.body, {new: true})

        updatedHoot._doc.author = req.user

        res.status(200).json(updatedHoot)

    } catch (error) {
        res.status(500).json({ err: error.message})
    }
})

router.delete('/:hootId', verifyToken, async (req,res) => {
    try {
        // Let's start by finding the hoot in question
        const hoot = await Hoot.findById(req.params.hootId)

        //Are we the user who made this hoot?

        if (!hoot.author.equals(req.user._id)) {
            return res.status(403).json({ err: "you're not the author of this hoot"})
        } 

        // If you are the real author, let's delete the hoot
        const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId)

        res.status(200).json(deletedHoot)

    } catch (error) {
        res.status(500).json({ err: error.message})
    }
})

// Comment CRUD:

//Create comment
router.post('/:hootId/comments', verifyToken, async (req, res) => {
    try {
        req.body.author = req.user._id

        const hoot = await Hoot.findById(req.params.hootId)

        hoot.comments.push(req.body)

        await hoot.save()

        const newComment = hoot.comments[hoot.comments.length - 1]

        newComment._doc.author = req.user

        res.status(201).json(newComment)

    } catch (error) {
        res.status(500).json({ err: error.message})
    }
})

// update comment in the hoot
router.put('/:hootId/comments/:commentId', verifyToken, async (req, res) => {
    try {
        
        const hoot = await Hoot.findById(req.params.hootId)
        const comment = hoot.comments.id(req.params.commentId)

        // ensures the current user is the author of the comment

        if (comment.author.toString() !== req.user._id) {
            return res
            . status(403)
            .json({ message: "You are not authorized to edit this comment" })
        }

        comment.text = req.body.text
        await hoot.save()
        res.status(200).json({ message: "Comment updated successfully" })

   
    } catch (error) {
        res.status(500).json({ err: error.message})
    }
})

//Delete comment
router.delete("/:hootId/comments/:commentId", verifyToken, async (req, res) => {
    try {
      const hoot = await Hoot.findById(req.params.hootId);
      const comment = hoot.comments.id(req.params.commentId);
  
      // ensures the current user is the author of the comment
      if (comment.author.toString() !== req.user._id) {
        return res
          .status(403)
          .json({ message: "You are not authorized to edit this comment" });
      }
  
      hoot.comments.remove({ _id: req.params.commentId });
      await hoot.save();
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
      res.status(500).json({ err: err.message });
    }
  });



module.exports = router