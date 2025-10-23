#!/usr/bin/env python3
import edcc

config = edcc.EncoderConfig(29, 5, 5, 10)
encoder = edcc.create_encoder(config)

# Test same person (a_01 vs a_02) - should be HIGH
a1 = encoder.encode_using_file("palmprint_data/a_01.bmp")
a2 = encoder.encode_using_file("palmprint_data/a_02.bmp")
print(f"Same person (a_01 vs a_02): {a1.compare_to(a2):.4f}")

# Test different people (a_01 vs b_01) - should be LOW
b1 = encoder.encode_using_file("palmprint_data/b_01.bmp")
print(f"Different people (a_01 vs b_01): {a1.compare_to(b1):.4f}")
