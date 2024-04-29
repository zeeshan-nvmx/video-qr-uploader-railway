const express = require('express')
require('dotenv').config()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 8000

app.use(cors())

const uploadsDir = '/railway/data/uploads'

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Multer configuration for handling file uploads with disk storage
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname.replace(/\s/g, '-').toLowerCase())
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 1024 * 5, // Sets the limit to 5GB
  },
})

app.get('/status', async (req, res) => {
  res.json({ status: 'server is up and running successfully' })
})

// Endpoint to upload videos to local volume storage
app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' })
  }

  res.json({ message: 'Video uploaded successfully', url: `/videos/${req.file.filename}` })
})

// Endpoint to fetch all videos from local volume storage
app.get('/videos', async (req, res) => {
  try {
    const files = await fs.promises.readdir(uploadsDir)
    const videos = files.map((file) => ({
      name: file,
      url: `/videos/${file}`,
    }))
    res.json(videos)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error fetching videos.' })
  }
})

// Endpoint to delete videos from local volume storage
app.delete('/delete/:videoName', async (req, res) => {
  const videoName = req.params.videoName

  if (!videoName) {
    return res.status(400).json({ error: 'Video name not provided.' })
  }

  const filePath = path.join(uploadsDir, videoName)

  try {
    await fs.promises.unlink(filePath)
    return res.json({ message: 'Video deleted successfully.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error deleting video.' })
  }
})

// Serve the uploaded videos as static files
app.use('/videos', express.static(uploadsDir))

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
