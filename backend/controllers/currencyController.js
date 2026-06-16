const getRates = async (req, res) => {
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/LKR`
    )
    const data = await response.json()

    if (data.result !== 'success') {
      return res.status(502).json({ success: false, message: 'Failed to fetch exchange rates' })
    }

    res.json({ success: true, rates: data.conversion_rates })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export { getRates }
