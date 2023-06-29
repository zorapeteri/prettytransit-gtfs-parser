import express from 'express'
const app = express()
const port = 4000

app.use(express.static('data'))

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})
