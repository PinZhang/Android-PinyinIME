/*
 * Copyright (C) 2009 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <assert.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <unistd.h>
#include <pthread.h>
#include <string.h>
#include "../include/matrixsearch.h"
#include "ConvertUTF.h"

using namespace ime_pinyin;

UTF8 g_utf8_buf[1024] = { 0 };

const char*
toUTF8(const char16* src, size_t length) {
  UTF16 *utf16Start = (UTF16 *) src;
  UTF16 *utf16End = (UTF16 *) (src + length);
  UTF8* utf8Start = g_utf8_buf;
  ConvertUTF16toUTF8((const UTF16 **) &utf16Start, utf16End, &utf8Start,
      &(g_utf8_buf[1024]), strictConversion);
  return (const char*) g_utf8_buf;
}

void
testMatrixSearch(const char* py) {
  MatrixSearch ms;
  ms.init("../../res/raw/dict_pinyin.png", "user.dic");
  for (int i = 0; i < 10; i++) {
    ms.reset_search();
    ms.search(py, strlen(py));

    char16 buffer[64];

    ms.get_candidate0(buffer, 64, NULL, false);

    size_t n = ms.get_candidate_num();

    printf("\n");
    for (size_t i = 0; i < n; i++) {
      if (i % 10 == 0) {
        printf("\n");
      }
      ms.get_candidate(i, buffer, 64);
      printf("%s ", toUTF8(buffer, 64));
    }
    printf("\n%ld candidate(s) for %s\n", n, py);

    char16 predict_buf[100][kMaxPredictSize + 1];
    ms.get_candidate0(buffer, 64, NULL, false);
    n = ms.get_predicts(buffer, predict_buf, 100);
    printf("\n%ld prediction word(s) for %s\n", n, toUTF8(buffer, 64));
    for (size_t i = 0; i < n; i++) {
      if (i % 10 == 0) {
        printf("\n");
      }
      printf("%s ", toUTF8(predict_buf[i], kMaxPredictSize + 1));
    }
  }
}

/**
 * Build binary dictionary model. Make sure that ___BUILD_MODEL___ is defined
 * in dictdef.h.
 */
int
main(int argc, char* argv[]) {
  char py[256] = "nia";
  if (argc > 1) {
    strncpy(py, argv[1], 256);
  }
  testMatrixSearch(py);
  return 0;
}
