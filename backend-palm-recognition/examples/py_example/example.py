# Copyright (c) 2019 leosocy. All rights reserved.
# Use of this source code is governed by a MIT-style license
# that can be found in the LICENSE file.

import os
import edcc

TEST_PALMPRINT_DATA_DIR = "../../palmprint_data"
TEST_A_01_PALMPRINT_IMAGE = os.path.join(TEST_PALMPRINT_DATA_DIR, "a_01.bmp")
TEST_A_02_PALMPRINT_IMAGE = os.path.join(TEST_PALMPRINT_DATA_DIR, "a_02.bmp")
TEST_B_01_PALMPRINT_IMAGE = os.path.join(TEST_PALMPRINT_DATA_DIR, "b_01.bmp")
TEST_B_02_PALMPRINT_IMAGE = os.path.join(TEST_PALMPRINT_DATA_DIR, "b_02.bmp")

Ali1 = os.path.join(TEST_PALMPRINT_DATA_DIR, "IMG_7034.jpg")
Ali2 = os.path.join(TEST_PALMPRINT_DATA_DIR, "IMG_7035.jpg")
Ali3 = os.path.join(TEST_PALMPRINT_DATA_DIR, "IMG_7036.jpg")

if __name__ == "__main__":
    hand1 = Ali1
    hand2 = Ali3

    config = edcc.EncoderConfig(29, 5, 5, 10)
    encoder = edcc.create_encoder(config)
    one_palmprint_code = encoder.encode_using_file(hand1)
    another_palmprint_code = encoder.encode_using_file(hand2)
    similarity_score = one_palmprint_code.compare_to(another_palmprint_code)
    print(
        "{} <-> {} similarity score:{}".format(
            hand1, hand2, similarity_score
        )
    )
