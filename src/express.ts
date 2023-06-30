import express from 'express'
// @ts-ignore
import cors from 'cors'
const app = express()
const port = 4000

app.use(cors())
app.use(express.static('data'))

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})
