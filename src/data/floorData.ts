// Generated from the Build 8.7 Live Floor snapshot (Al Malqa Men, 2026-10-22). Positions in metres.
// x = east-west, z = depth, rotation in degrees about Y. Zone codes are kept for the Admin view only;
// the UI shows human names ("Treadmill 3, zone 1").
import type { FloorPlacement, LibraryModelSeed } from './types';

export const FLOOR_SIZE_M = { x: [-16.1, 14.6] as [number, number], z: [-1.5, 14.5] as [number, number], width: 30.6, depth: 16 };

export const MALQA_PLACEMENTS: FloorPlacement[] = [
 {
  "id": "sbtreadmill1",
  "num": 1,
  "type": "slat-treadmill",
  "nameEn": "Slat treadmill 1",
  "nameAr": "مشاية بسير شرائحي 1",
  "x": -3.0,
  "z": 0.0,
  "rot": 180,
  "camera": "fe1-nw",
  "zones": [
   {
    "code": "Z_SBTRDML_1_Z1",
    "camera": "fe1-nw",
    "n": 1
   },
   {
    "code": "Z_SBTRDML_1_Z2",
    "camera": "fe1-nw",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 19,
  "todayUsedMin": 266
 },
 {
  "id": "sbtreadmill2",
  "num": 2,
  "type": "slat-treadmill",
  "nameEn": "Slat treadmill 2",
  "nameAr": "مشاية بسير شرائحي 2",
  "x": -1.0,
  "z": 0.08,
  "rot": 180,
  "camera": "fe1-nw",
  "zones": [
   {
    "code": "Z_SBTRDML_2_Z1",
    "camera": "fe1-nw",
    "n": 1
   },
   {
    "code": "Z_SBTRDML_2_Z2",
    "camera": "fe1-nw",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 15,
  "todayUsedMin": 343
 },
 {
  "id": "sbtreadmill3",
  "num": 3,
  "type": "slat-treadmill",
  "nameEn": "Slat treadmill 3",
  "nameAr": "مشاية بسير شرائحي 3",
  "x": 0.91,
  "z": 0.23,
  "rot": 180,
  "camera": "fe1-nw",
  "zones": [
   {
    "code": "Z_SBTRDML_3_Z1",
    "camera": "fe1-nw",
    "n": 1
   },
   {
    "code": "Z_SBTRDML_3_Z2",
    "camera": "fe1-nw",
    "n": 2
   },
   {
    "code": "Z_SBTRDML_3_Z3",
    "camera": "fe2-sw",
    "n": 3
   },
   {
    "code": "Z_SBTRDML_3_Z4",
    "camera": "fe2-sw",
    "n": 4
   }
  ],
  "rule": "and",
  "todaySessions": 18,
  "todayUsedMin": 409
 },
 {
  "id": "sbtreadmill4",
  "num": 4,
  "type": "slat-treadmill",
  "nameEn": "Slat treadmill 4",
  "nameAr": "مشاية بسير شرائحي 4",
  "x": 2.73,
  "z": 0.22,
  "rot": 180,
  "camera": "fe1-nw",
  "zones": [
   {
    "code": "Z_SBTRDML_4_Z1",
    "camera": "fe2-sw",
    "n": 1
   },
   {
    "code": "Z_SBTRDML_4_Z2",
    "camera": "fe2-sw",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 22,
  "todayUsedMin": 251
 },
 {
  "id": "sbtreadmill5",
  "num": 5,
  "type": "slat-treadmill",
  "nameEn": "Slat treadmill 5",
  "nameAr": "مشاية بسير شرائحي 5",
  "x": 4.55,
  "z": 0.09,
  "rot": 180,
  "camera": "fe1-nw",
  "zones": [
   {
    "code": "Z_SBTRDML_5_Z1",
    "camera": "fe2-sw",
    "n": 1
   },
   {
    "code": "Z_SBTRDML_5_Z2",
    "camera": "fe2-sw",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 23,
  "todayUsedMin": 373
 },
 {
  "id": "bikeindoor1",
  "num": 1,
  "type": "indoor-bike",
  "nameEn": "Indoor bike 1",
  "nameAr": "دراجة داخلية 1",
  "x": -1.57,
  "z": 3.45,
  "rot": 180,
  "camera": "fe1-ne",
  "zones": [
   {
    "code": "Z_BIKEINDOOR_1_Z1",
    "camera": "fe1-ne",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 3,
  "todayUsedMin": 52.6
 },
 {
  "id": "bikeindoor2",
  "num": 2,
  "type": "indoor-bike",
  "nameEn": "Indoor bike 2",
  "nameAr": "دراجة داخلية 2",
  "x": 0.12,
  "z": 3.47,
  "rot": 180,
  "camera": "fe1-ne",
  "zones": [
   {
    "code": "Z_BIKEINDOOR_2_Z1",
    "camera": "fe1-ne",
    "n": 1
   },
   {
    "code": "Z_BIKEINDOOR_2_Z2",
    "camera": "fe2-se",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 3,
  "todayUsedMin": 47.0
 },
 {
  "id": "bikeindoor3",
  "num": 3,
  "type": "indoor-bike",
  "nameEn": "Indoor bike 3",
  "nameAr": "دراجة داخلية 3",
  "x": 1.68,
  "z": 3.4,
  "rot": 180,
  "camera": "fe1-ne",
  "zones": [
   {
    "code": "Z_BIKEINDOOR_3_Z1",
    "camera": "fe2-se",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 2,
  "todayUsedMin": 33.9
 },
 {
  "id": "rowingmachine1",
  "num": 1,
  "type": "rower",
  "nameEn": "Rowing machine 1",
  "nameAr": "جهاز تجديف 1",
  "x": -1.68,
  "z": 6.68,
  "rot": 180,
  "camera": "fe1-ne",
  "zones": [
   {
    "code": "Z_ROWINGM_1_Z1",
    "camera": "fe1-ne",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 5,
  "todayUsedMin": 14.0
 },
 {
  "id": "rowingmachine2",
  "num": 2,
  "type": "rower",
  "nameEn": "Rowing machine 2",
  "nameAr": "جهاز تجديف 2",
  "x": 0.33,
  "z": 6.82,
  "rot": 180,
  "camera": "fe1-ne",
  "zones": [
   {
    "code": "Z_ROWINGM_2_Z2",
    "camera": "fe1-ne",
    "n": 1
   },
   {
    "code": "Z_ROWINGM_2_Z1",
    "camera": "fe2-se",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 0,
  "todayUsedMin": 0.0
 },
 {
  "id": "rowingmachine3",
  "num": 3,
  "type": "rower",
  "nameEn": "Rowing machine 3",
  "nameAr": "جهاز تجديف 3",
  "x": 2.53,
  "z": 6.75,
  "rot": 180,
  "camera": "fe1-ne",
  "zones": [
   {
    "code": "Z_ROWINGM_3_Z1",
    "camera": "fe2-se",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 7,
  "todayUsedMin": 20.6
 },
 {
  "id": "fbtreadmill6",
  "num": 6,
  "type": "treadmill",
  "nameEn": "Treadmill 6",
  "nameAr": "مشاية 6",
  "x": -5.23,
  "z": 0.63,
  "rot": 0,
  "camera": "fe1-sw",
  "zones": [
   {
    "code": "Z_FBTRDML_6_Z1",
    "camera": "fe1-sw",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 9,
  "todayUsedMin": 201
 },
 {
  "id": "fbtreadmill7",
  "num": 7,
  "type": "treadmill",
  "nameEn": "Treadmill 7",
  "nameAr": "مشاية 7",
  "x": 6.18,
  "z": 0.39,
  "rot": 0,
  "camera": "fe2-nw",
  "zones": [
   {
    "code": "Z_FBTRDML_7_Z1",
    "camera": "fe2-nw",
    "n": 1
   },
   {
    "code": "Z_FBTRDML_7_Z2",
    "camera": "fe2-nw",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 6,
  "todayUsedMin": 128
 },
 {
  "id": "fbtreadmill8",
  "num": 8,
  "type": "treadmill",
  "nameEn": "Treadmill 8",
  "nameAr": "مشاية 8",
  "x": 7.79,
  "z": 0.43,
  "rot": 0,
  "camera": "fe2-nw",
  "zones": [
   {
    "code": "Z_FBTRDML_8_Z1",
    "camera": "fe2-nw",
    "n": 1
   },
   {
    "code": "Z_FBTRDML_8_Z2",
    "camera": "fe2-nw",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 8,
  "todayUsedMin": 161
 },
 {
  "id": "fbtreadmill9",
  "num": 9,
  "type": "treadmill",
  "nameEn": "Treadmill 9",
  "nameAr": "مشاية 9",
  "x": 9.37,
  "z": 0.37,
  "rot": 0,
  "camera": "fe2-nw",
  "zones": [
   {
    "code": "Z_FBTRDML_9_Z1",
    "camera": "fe2-nw",
    "n": 1
   },
   {
    "code": "Z_FBTRDML_9_Z2",
    "camera": "fe2-nw",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 4,
  "todayUsedMin": 71
 },
 {
  "id": "stairclimber3",
  "num": 3,
  "type": "stair-climber",
  "nameEn": "Stair climber 3",
  "nameAr": "جهاز صعود الدرج 3",
  "x": -4.85,
  "z": 6.95,
  "rot": 0,
  "camera": "fe1-se",
  "zones": [
   {
    "code": "Z_STAIRCLIMBER_3_Z1",
    "camera": "fe1-se",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 18,
  "todayUsedMin": 71
 },
 {
  "id": "stairclimber2",
  "num": 2,
  "type": "stair-climber",
  "nameEn": "Stair climber 2",
  "nameAr": "جهاز صعود الدرج 2",
  "x": -6.92,
  "z": 6.97,
  "rot": 0,
  "camera": "fe1-se",
  "zones": [
   {
    "code": "Z_STAIRCLIMBER_2_Z1",
    "camera": "fe1-se",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 22,
  "todayUsedMin": 147
 },
 {
  "id": "stairclimber1",
  "num": 1,
  "type": "stair-climber",
  "nameEn": "Stair climber 1",
  "nameAr": "جهاز صعود الدرج 1",
  "x": -8.99,
  "z": 6.95,
  "rot": 0,
  "camera": "fe1-se",
  "zones": [
   {
    "code": "Z_STAIRCLIMBER_1_Z1",
    "camera": "fe1-se",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 27,
  "todayUsedMin": 82
 },
 {
  "id": "fbtreadmill5",
  "num": 5,
  "type": "treadmill",
  "nameEn": "Treadmill 5",
  "nameAr": "مشاية 5",
  "x": -7.21,
  "z": 0.63,
  "rot": 0,
  "camera": "fe1-sw",
  "zones": [
   {
    "code": "Z_FBTRDML_5_Z1",
    "camera": "fe1-sw",
    "n": 1
   },
   {
    "code": "Z_FBTRDML_5_Z2",
    "camera": "fe1-sw",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 20,
  "todayUsedMin": 146
 },
 {
  "id": "fbtreadmill4",
  "num": 4,
  "type": "treadmill",
  "nameEn": "Treadmill 4",
  "nameAr": "مشاية 4",
  "x": -9.25,
  "z": 0.75,
  "rot": 0,
  "camera": "fe1-sw",
  "zones": [
   {
    "code": "Z_FBTRDML_4_Z1",
    "camera": "fe1-sw",
    "n": 1
   },
   {
    "code": "Z_FBTRDML_4_Z2",
    "camera": "fe1-sw",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 5,
  "todayUsedMin": 37.9
 },
 {
  "id": "ellipticaltrainer2",
  "num": 2,
  "type": "elliptical",
  "nameEn": "Elliptical 2",
  "nameAr": "جهاز إهليلجي 2",
  "x": -10.46,
  "z": 4.0,
  "rot": 0,
  "camera": "fe1-se",
  "zones": [
   {
    "code": "Z_ELIPTR_2_Z1",
    "camera": "fe1-se",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 27,
  "todayUsedMin": 142
 },
 {
  "id": "ellipticaltrainer5",
  "num": 5,
  "type": "elliptical",
  "nameEn": "Elliptical 5",
  "nameAr": "جهاز إهليلجي 5",
  "x": -5.14,
  "z": 3.92,
  "rot": 0,
  "camera": "fe1-se",
  "zones": [
   {
    "code": "Z_ELIPTR_5_Z1",
    "camera": "fe1-se",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 8,
  "todayUsedMin": 96
 },
 {
  "id": "ellipticaltrainer4",
  "num": 4,
  "type": "elliptical",
  "nameEn": "Elliptical 4",
  "nameAr": "جهاز إهليلجي 4",
  "x": -6.9,
  "z": 3.97,
  "rot": 0,
  "camera": "fe1-se",
  "zones": [
   {
    "code": "Z_ELIPTR_4_Z1",
    "camera": "fe1-se",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 5,
  "todayUsedMin": 39.5
 },
 {
  "id": "ellipticaltrainer3",
  "num": 3,
  "type": "elliptical",
  "nameEn": "Elliptical 3",
  "nameAr": "جهاز إهليلجي 3",
  "x": -8.61,
  "z": 3.93,
  "rot": 0,
  "camera": "fe1-se",
  "zones": [
   {
    "code": "Z_ELIPTR_3_Z1",
    "camera": "fe1-se",
    "n": 1
   }
  ],
  "rule": "or",
  "todaySessions": 10,
  "todayUsedMin": 147
 },
 {
  "id": "ellipticaltrainer1",
  "num": 1,
  "type": "elliptical",
  "nameEn": "Elliptical 1",
  "nameAr": "جهاز إهليلجي 1",
  "x": -12.23,
  "z": 4.28,
  "rot": 0,
  "camera": "fe1-se",
  "zones": [
   {
    "code": "Z_ELIPTR_1_Z1",
    "camera": "fe1-se",
    "n": 1
   },
   {
    "code": "Z_ELIPTR_1_Z2",
    "camera": "fe1-se",
    "n": 2
   },
   {
    "code": "Z_ELIPTCLTRNR_1_Z2",
    "camera": "n8-ch3",
    "n": 3
   }
  ],
  "rule": "and",
  "todaySessions": 7,
  "todayUsedMin": 130
 },
 {
  "id": "ellipticaltrainer6",
  "num": 6,
  "type": "elliptical",
  "nameEn": "Elliptical 6",
  "nameAr": "جهاز إهليلجي 6",
  "x": 3.58,
  "z": 3.91,
  "rot": 0,
  "camera": "fe2-ne",
  "zones": [
   {
    "code": "Z_ELIPTR_6_Z1",
    "camera": "fe2-ne",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 3,
  "todayUsedMin": 6.9
 },
 {
  "id": "ellipticaltrainer7",
  "num": 7,
  "type": "elliptical",
  "nameEn": "Elliptical 7",
  "nameAr": "جهاز إهليلجي 7",
  "x": 5.14,
  "z": 4.03,
  "rot": 0,
  "camera": "fe2-ne",
  "zones": [
   {
    "code": "Z_ELIPTR_7_Z2",
    "camera": "fe2-nw",
    "n": 1
   },
   {
    "code": "Z_ELIPTR_7_Z1",
    "camera": "fe2-ne",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 9,
  "todayUsedMin": 81
 },
 {
  "id": "ellipticaltrainer8",
  "num": 8,
  "type": "elliptical",
  "nameEn": "Elliptical 8",
  "nameAr": "جهاز إهليلجي 8",
  "x": 6.66,
  "z": 3.96,
  "rot": 0,
  "camera": "fe2-ne",
  "zones": [
   {
    "code": "Z_ELIPTR_8_Z1",
    "camera": "fe2-ne",
    "n": 1
   },
   {
    "code": "Z_ELIPTR_8_Z2",
    "camera": "fe2-ne",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 2,
  "todayUsedMin": 9.9
 },
 {
  "id": "bikeindoor4",
  "num": 4,
  "type": "indoor-bike",
  "nameEn": "Indoor bike 4",
  "nameAr": "دراجة داخلية 4",
  "x": 4.52,
  "z": 8.17,
  "rot": 0,
  "camera": "fe2-ne",
  "zones": [
   {
    "code": "Z_BIKEINDOOR_4_Z1",
    "camera": "fe2-ne",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 15,
  "todayUsedMin": 112
 },
 {
  "id": "bikeindoor5",
  "num": 5,
  "type": "indoor-bike",
  "nameEn": "Indoor bike 5",
  "nameAr": "دراجة داخلية 5",
  "x": 6.06,
  "z": 8.2,
  "rot": 0,
  "camera": "fe2-ne",
  "zones": [
   {
    "code": "Z_BIKEINDOOR_5_Z1",
    "camera": "fe2-ne",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 20,
  "todayUsedMin": 122
 },
 {
  "id": "bikeindoor6",
  "num": 6,
  "type": "indoor-bike",
  "nameEn": "Indoor bike 6",
  "nameAr": "دراجة داخلية 6",
  "x": 7.63,
  "z": 8.44,
  "rot": 0,
  "camera": "fe2-ne",
  "zones": [
   {
    "code": "Z_BIKEINDOOR_6_Z1",
    "camera": "fe2-ne",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 20,
  "todayUsedMin": 39.5
 },
 {
  "id": "recumbentbike1",
  "num": 1,
  "type": "recumbent-bike",
  "nameEn": "Recumbent bike 1",
  "nameAr": "دراجة بمسند ظهر 1",
  "x": 9.54,
  "z": 8.47,
  "rot": 0,
  "camera": "fe2-ne",
  "zones": [
   {
    "code": "Z_RECBIKE_1_Z1",
    "camera": "fe2-ne",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 40,
  "todayUsedMin": 136
 },
 {
  "id": "recumbentbike2",
  "num": 2,
  "type": "recumbent-bike",
  "nameEn": "Recumbent bike 2",
  "nameAr": "دراجة بمسند ظهر 2",
  "x": 11.41,
  "z": 8.31,
  "rot": 0,
  "camera": "fe2-ne",
  "zones": [
   {
    "code": "Z_RECBIKE_2_Z1",
    "camera": "fe2-ne",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 42,
  "todayUsedMin": 73
 },
 {
  "id": "fbtreadmill10",
  "num": 10,
  "type": "treadmill",
  "nameEn": "Treadmill 10",
  "nameAr": "مشاية 10",
  "x": 11.15,
  "z": 0.28,
  "rot": 0,
  "camera": "fe2-nw",
  "zones": [
   {
    "code": "Z_FBTRDML_10_Z1",
    "camera": "fe2-nw",
    "n": 1
   },
   {
    "code": "Z_FBTRDML_10_Z2",
    "camera": "fe2-nw",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 15,
  "todayUsedMin": 229
 },
 {
  "id": "fbtreadmill11",
  "num": 11,
  "type": "treadmill",
  "nameEn": "Treadmill 11",
  "nameAr": "مشاية 11",
  "x": 13.1,
  "z": 0.71,
  "rot": 0,
  "camera": "fe1-nw",
  "zones": [
   {
    "code": "Z_FBTRDM_11_Z1",
    "camera": "n8-ch4",
    "n": 1
   }
  ],
  "rule": "or",
  "todaySessions": 31,
  "todayUsedMin": 419
 },
 {
  "id": "flatbenchpress1",
  "num": 1,
  "type": "flat-bench",
  "nameEn": "Flat bench press 1",
  "nameAr": "بنش أفقي 1",
  "x": 0.26,
  "z": 13.01,
  "rot": 0,
  "camera": "n9-ch13",
  "zones": [
   {
    "code": "Z_FBENCHPRESS_1_Z1",
    "camera": "n9-ch13",
    "n": 1
   },
   {
    "code": "Z_FBENCHPRESS_1_Z2",
    "camera": "n9-ch14",
    "n": 2
   },
   {
    "code": "Z_FBENCHPRESS_1_Z3",
    "camera": "n9-ch14",
    "n": 3
   }
  ],
  "rule": "and",
  "todaySessions": 12,
  "todayUsedMin": 19.0
 },
 {
  "id": "flatbenchpress2",
  "num": 2,
  "type": "flat-bench",
  "nameEn": "Flat bench press 2",
  "nameAr": "بنش أفقي 2",
  "x": 2.97,
  "z": 12.89,
  "rot": 0,
  "camera": "n9-ch13",
  "zones": [
   {
    "code": "Z_FBENCHPRESS_2_Z1",
    "camera": "n9-ch13",
    "n": 1
   },
   {
    "code": "Z_FBENCHPRESS_2_Z2",
    "camera": "n9-ch14",
    "n": 2
   },
   {
    "code": "Z_FBENCHPRESS_2_Z3",
    "camera": "n9-ch14",
    "n": 3
   }
  ],
  "rule": "and",
  "todaySessions": 11,
  "todayUsedMin": 26.7
 },
 {
  "id": "fbtreadmill3",
  "num": 3,
  "type": "treadmill",
  "nameEn": "Treadmill 3",
  "nameAr": "مشاية 3",
  "x": -11.18,
  "z": 0.77,
  "rot": 0,
  "camera": "fe1-sw",
  "zones": [
   {
    "code": "Z_FBTREADMILL_3_Z1",
    "camera": "fe1-sw",
    "n": 1
   },
   {
    "code": "Z_FBTREADMILL_3_Z2",
    "camera": "n8-ch3",
    "n": 2
   }
  ],
  "rule": "and",
  "todaySessions": 9,
  "todayUsedMin": 75
 },
 {
  "id": "fbtreadmill1",
  "num": 1,
  "type": "treadmill",
  "nameEn": "Treadmill 1",
  "nameAr": "مشاية 1",
  "x": -14.55,
  "z": 0.87,
  "rot": 0,
  "camera": "n8-ch3",
  "zones": [
   {
    "code": "Z_FBTREADMILL_1_Z1",
    "camera": "n8-ch3",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 11,
  "todayUsedMin": 96
 },
 {
  "id": "fbtreadmill2",
  "num": 2,
  "type": "treadmill",
  "nameEn": "Treadmill 2",
  "nameAr": "مشاية 2",
  "x": -12.95,
  "z": 0.84,
  "rot": 0,
  "camera": "n8-ch3",
  "zones": [
   {
    "code": "Z_FBTREADMILL_2_Z1",
    "camera": "n8-ch3",
    "n": 1
   }
  ],
  "rule": "and",
  "todaySessions": 17,
  "todayUsedMin": 150
 }
];

export const LIBRARY_SEED: LibraryModelSeed[] = [
 {
  "number": "01",
  "id": "stair-climber",
  "name": "Stair climber",
  "category": "Cardio",
  "subcategory": "Stair Climber",
  "description": "A tall step machine with a broad console, sculpted housing and wraparound handrails.",
  "motion_zone": "A visible step edge or a foot on the steps",
  "operator_zone": "Torso between the handrails",
  "provisional": true,
  "instances_on_live_floor": 3
 },
 {
  "number": "02",
  "id": "rower",
  "name": "Rowing machine",
  "category": "Cardio",
  "subcategory": "Rower",
  "description": "A long sliding-seat rail, front flywheel, footplates and a pull handle.",
  "motion_zone": "The sliding seat, exposed rail beside it, or the pull handle",
  "operator_zone": "Torso along the rowing path, excluding neighboring stations",
  "provisional": false,
  "instances_on_live_floor": 3
 },
 {
  "number": "03",
  "id": "indoor-bike",
  "name": "Indoor bike",
  "category": "Cardio",
  "subcategory": "Indoor Bike",
  "description": "A compact cycle with a front flywheel, adjustable saddle, handlebars and a small display.",
  "motion_zone": "A pedal/crank edge or the rider's lower leg",
  "operator_zone": "Torso above the saddle",
  "provisional": false,
  "instances_on_live_floor": 6
 },
 {
  "number": "04",
  "id": "elliptical",
  "name": "Elliptical trainer",
  "category": "Cardio",
  "subcategory": "Elliptical",
  "description": "Long pedal linkages, an enclosed rear drive and paired upright handles.",
  "motion_zone": "One pedal linkage or a moving handle below the grip",
  "operator_zone": "Torso behind the console",
  "provisional": false,
  "instances_on_live_floor": 8
 },
 {
  "number": "05",
  "id": "treadmill",
  "name": "Flat-belt treadmill",
  "category": "Cardio",
  "subcategory": "Treadmill",
  "description": "A flat running belt, broad side rails, twin uprights and a large console.",
  "motion_zone": "Feet or lower legs above the running belt",
  "operator_zone": "Torso centered between the side rails",
  "provisional": false,
  "instances_on_live_floor": 11
 },
 {
  "number": "06",
  "id": "slat-treadmill",
  "name": "Slatted-belt treadmill",
  "category": "Cardio",
  "subcategory": "Slat Treadmill",
  "description": "A ribbed running surface, tall uprights, console and yellow trim at the belt ends.",
  "motion_zone": "Feet or lower legs above the slats",
  "operator_zone": "Torso inside the running lane",
  "provisional": true,
  "instances_on_live_floor": 5
 },
 {
  "number": "07",
  "id": "preacher-curl",
  "name": "Seated preacher curl",
  "category": "Strength",
  "subcategory": "Preacher Curl",
  "description": "Tan sloping arm pad, adjustable seat, dark frame and EZ curl bar.",
  "motion_zone": "Hands and bar in front of the arm pad",
  "operator_zone": "Torso within this machine footprint, excluding adjacent stations.",
  "provisional": true,
  "instances_on_live_floor": 0
 },
 {
  "number": "08",
  "id": "standing-preacher",
  "name": "Standing preacher curl",
  "category": "Strength",
  "subcategory": "Standing Preacher",
  "description": "Tall tan arm-support pad and twin storage/support rails. Standing use is inferred from the visible frame.",
  "motion_zone": "Hands lifting in front of the pad",
  "operator_zone": "Torso within this machine footprint, excluding adjacent stations.",
  "provisional": true,
  "instances_on_live_floor": 0
 },
 {
  "number": "09",
  "id": "incline-bench",
  "name": "Incline bench press",
  "category": "Strength",
  "subcategory": "Incline Bench",
  "description": "Tan inclined back pad, separate seat and Olympic bar rack.",
  "motion_zone": "One bar end above the upper chest",
  "operator_zone": "Torso within this machine footprint, excluding adjacent stations.",
  "provisional": true,
  "instances_on_live_floor": 0
 },
 {
  "number": "10",
  "id": "flat-bench",
  "name": "Flat bench press",
  "category": "Strength",
  "subcategory": "Flat Bench",
  "description": "Long tan flat bench with twin rack uprights and Olympic bar.",
  "motion_zone": "One bar end above the chest",
  "operator_zone": "Torso within this machine footprint, excluding adjacent stations.",
  "provisional": true,
  "instances_on_live_floor": 2
 },
 {
  "number": "11",
  "id": "incline-treadmill",
  "name": "Incline treadmill",
  "category": "Cardio",
  "subcategory": "Incline Treadmill",
  "description": "Broad flat belt on an inclined deck, front console and long side handles.",
  "motion_zone": "Feet above the belt; exclude an empty running belt",
  "operator_zone": "Torso within this machine footprint, excluding adjacent stations.",
  "provisional": true,
  "instances_on_live_floor": 0
 },
 {
  "number": "12",
  "id": "upper-body-ergometer",
  "name": "Upper-body ergometer",
  "category": "Cardio",
  "subcategory": "Upper Body Ergometer",
  "description": "Standing platform, raised hand crank and screen.",
  "motion_zone": "One hand crank or forearm",
  "operator_zone": "Torso within this machine footprint, excluding adjacent stations.",
  "provisional": true,
  "instances_on_live_floor": 0
 },
 {
  "number": "13",
  "id": "recumbent-bike",
  "name": "Recumbent bike",
  "category": "Cardio",
  "subcategory": "Recumbent Bike",
  "description": "Low supported seat and backrest with forward pedals and console.",
  "motion_zone": "Pedal crank or lower leg",
  "operator_zone": "Torso within this machine footprint, excluding adjacent stations.",
  "provisional": true,
  "instances_on_live_floor": 2
 },
 {
  "number": "14",
  "id": "adaptive-cross-trainer",
  "name": "Adaptive-stride trainer",
  "category": "Cardio",
  "subcategory": "Adaptive Cross Trainer",
  "description": "Front linkage housing, suspended pedals, tall paired handles and rear access step.",
  "motion_zone": "Pedal linkage or moving handle",
  "operator_zone": "Torso within this machine footprint, excluding adjacent stations.",
  "provisional": true,
  "instances_on_live_floor": 0
 }
];
