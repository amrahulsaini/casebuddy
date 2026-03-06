-- Add Gemini 3.1 Flash Image Preview (Nano Banana 2) pricing
-- Pricing source: https://ai.google.dev/pricing
-- Input:  $0.25 / 1M tokens (text + image)
-- Output: $1.50 / 1M tokens (text/thinking), $30.00 / 1M image tokens
--         = $0.022 per 512px image
--         = $0.034 per 1K image
--         = $0.050 per 2K image
--         = $0.076 per 4K image

INSERT INTO `pricing_config`
  (`model_name`, `input_text_price_per_1m`, `input_image_price`, `output_text_price_per_1m`, `output_image_price`, `output_image_4k_price`, `usd_to_inr_rate`)
VALUES
  ('gemini-3.1-flash-image-preview', 0.250000, 0.250000, 1.500000, 0.022000, 0.076000, 86.0000)
ON DUPLICATE KEY UPDATE
  input_text_price_per_1m  = VALUES(input_text_price_per_1m),
  input_image_price        = VALUES(input_image_price),
  output_text_price_per_1m = VALUES(output_text_price_per_1m),
  output_image_price       = VALUES(output_image_price),
  output_image_4k_price    = VALUES(output_image_4k_price),
  usd_to_inr_rate          = VALUES(usd_to_inr_rate);
