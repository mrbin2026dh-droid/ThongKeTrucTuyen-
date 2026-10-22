// Dữ liệu 97 Cán bộ - Giáo viên - Nhân viên nhà trường
// Nguồn gốc: C:\Users\HPZBook\Desktop\TẬP HUẤN\Danh Sách GV-NV.xlsx
const TEACHERS_DATABASE = [
  {
    "stt": 1,
    "id": "GV001",
    "name": "NGÔ THỊ LIỀN",
    "role": "Hiệu phó",
    "cccd": "034178009616",
    "phone": "0963167046",
    "folderName": "01 - NGÔ THỊ LIỀN"
  },
  {
    "stt": 2,
    "id": "GV002",
    "name": "NGUYỄN VĂN HIỀN",
    "role": "Hiệu trưởng",
    "cccd": "040077003374",
    "phone": "0905223269",
    "folderName": "02 - NGUYỄN VĂN HIỀN"
  },
  {
    "stt": 3,
    "id": "GV003",
    "name": "NGUYỄN QUANG NHẬT",
    "role": "Hiệu phó",
    "cccd": "042077002074",
    "phone": "0844611179",
    "folderName": "03 - NGUYỄN QUANG NHẬT"
  },
  {
    "stt": 4,
    "id": "GV004",
    "name": "LẠI VĂN TRỌNG",
    "role": "Giáo viên",
    "cccd": "034073010250",
    "phone": "0852680429",
    "folderName": "04 - LẠI VĂN TRỌNG"
  },
  {
    "stt": 5,
    "id": "GV005",
    "name": "ĐÀO THỊ THANH THÚY",
    "role": "Tổ trưởng",
    "cccd": "034179010376",
    "phone": "0932073116",
    "folderName": "05 - ĐÀO THỊ THANH THÚY"
  },
  {
    "stt": 6,
    "id": "GV006",
    "name": "NGUYỄN THỊ HẢI QUYÊN",
    "role": "Tổ trưởng",
    "cccd": "034179010748",
    "phone": "0384358777",
    "folderName": "06 - NGUYỄN THỊ HẢI QUYÊN"
  },
  {
    "stt": 7,
    "id": "GV007",
    "name": "NGUYỄN THỊ LỢI",
    "role": "Tổ trưởng",
    "cccd": "042178001986",
    "phone": "0942519633",
    "folderName": "07 - NGUYỄN THỊ LỢI"
  },
  {
    "stt": 8,
    "id": "GV008",
    "name": "TRẦN THỊ CẨM TÚ",
    "role": "Tổ trưởng",
    "cccd": "048175000449",
    "phone": "0968474568",
    "folderName": "08 - TRẦN THỊ CẨM TÚ"
  },
  {
    "stt": 9,
    "id": "GV009",
    "name": "NGÔ PHÚC TRUNG",
    "role": "Giáo viên",
    "cccd": "042078005083",
    "phone": "0812221009",
    "folderName": "09 - NGÔ PHÚC TRUNG"
  },
  {
    "stt": 10,
    "id": "GV010",
    "name": "ĐẶNG THỊ LỆ",
    "role": "Giáo viên",
    "cccd": "042177001969",
    "phone": "0767172279",
    "folderName": "10 - ĐẶNG THỊ LỆ"
  },
  {
    "stt": 11,
    "id": "GV011",
    "name": "NÔNG HỒNG HÓA",
    "role": "Giáo viên",
    "cccd": "062084000645",
    "phone": "0979401885",
    "folderName": "11 - NÔNG HỒNG HÓA"
  },
  {
    "stt": 12,
    "id": "GV012",
    "name": "NGUYỄN THỊ KIM LAN",
    "role": "Giáo viên",
    "cccd": "062183000548",
    "phone": "0379500127",
    "folderName": "12 - NGUYỄN THỊ KIM LAN"
  },
  {
    "stt": 13,
    "id": "GV013",
    "name": "NGUYỄN THỊ NGA DUNG",
    "role": "Giáo viên",
    "cccd": "01176028161",
    "phone": "0777559879",
    "folderName": "13 - NGUYỄN THỊ NGA DUNG"
  },
  {
    "stt": 14,
    "id": "GV014",
    "name": "PHÙNG THỊ THỦY",
    "role": "Giáo viên",
    "cccd": "01184045987",
    "phone": "0979020005",
    "folderName": "14 - PHÙNG THỊ THỦY"
  },
  {
    "stt": 15,
    "id": "GV015",
    "name": "NGÔ THỊ THUẬN",
    "role": "Giáo viên",
    "cccd": "024186001960",
    "phone": "0983799151",
    "folderName": "15 - NGÔ THỊ THUẬN"
  },
  {
    "stt": 16,
    "id": "GV016",
    "name": "LÝ ANH HẢO",
    "role": "Giáo viên",
    "cccd": "030081012628",
    "phone": "0978760924",
    "folderName": "16 - LÝ ANH HẢO"
  },
  {
    "stt": 17,
    "id": "GV017",
    "name": "NGUYỄN MẠNH TOẢN",
    "role": "Giáo viên",
    "cccd": "030083014414",
    "phone": "0981885083",
    "folderName": "17 - NGUYỄN MẠNH TOẢN"
  },
  {
    "stt": 18,
    "id": "GV018",
    "name": "BÙI THỊ HẰNG",
    "role": "Giáo viên",
    "cccd": "030179009022",
    "phone": "0978174705",
    "folderName": "18 - BÙI THỊ HẰNG"
  },
  {
    "stt": 19,
    "id": "GV019",
    "name": "ĐỖ THỊ DUNG",
    "role": "Giáo viên",
    "cccd": "030181009516",
    "phone": "0368238485",
    "folderName": "19 - ĐỖ THỊ DUNG"
  },
  {
    "stt": 20,
    "id": "GV020",
    "name": "PHẠM THỊ NHUNG",
    "role": "Giáo viên",
    "cccd": "030189013349",
    "phone": "0987898984",
    "folderName": "20 - PHẠM THỊ NHUNG"
  },
  {
    "stt": 21,
    "id": "GV021",
    "name": "NGUYỄN ĐĂNG KHƯƠNG",
    "role": "Giáo viên",
    "cccd": "034082014147",
    "phone": "0793692332",
    "folderName": "21 - NGUYỄN ĐĂNG KHƯƠNG"
  },
  {
    "stt": 22,
    "id": "GV022",
    "name": "NGUYỄN THỊ HOA",
    "role": "Giáo viên",
    "cccd": "034175015784",
    "phone": "0985408301",
    "folderName": "22 - NGUYỄN THỊ HOA"
  },
  {
    "stt": 23,
    "id": "GV023",
    "name": "NGUYỄN THỊ LỤA",
    "role": "Giáo viên",
    "cccd": "034180011561",
    "phone": "0914346338",
    "folderName": "23 - NGUYỄN THỊ LỤA"
  },
  {
    "stt": 24,
    "id": "GV024",
    "name": "NGUYỄN THỊ VÂN",
    "role": "Giáo viên",
    "cccd": "034182014399",
    "phone": "0364742809",
    "folderName": "24 - NGUYỄN THỊ VÂN"
  },
  {
    "stt": 25,
    "id": "GV025",
    "name": "BÙI THỊ THÚY",
    "role": "Giáo viên",
    "cccd": "034182016566",
    "phone": "0989040997",
    "folderName": "25 - BÙI THỊ THÚY"
  },
  {
    "stt": 26,
    "id": "GV026",
    "name": "NGUYỄN THỊ HỒNG DƯỢC",
    "role": "Giáo viên",
    "cccd": "034183014145",
    "phone": "0966447035",
    "folderName": "26 - NGUYỄN THỊ HỒNG DƯỢC"
  },
  {
    "stt": 27,
    "id": "GV027",
    "name": "PHẠM TUẤN ANH",
    "role": "Giáo viên",
    "cccd": "036082022064",
    "phone": "0973327632",
    "folderName": "27 - PHẠM TUẤN ANH"
  },
  {
    "stt": 28,
    "id": "GV028",
    "name": "TRẦN THỊ HUYỀN",
    "role": "Giáo viên",
    "cccd": "037184007487",
    "phone": "0976232841",
    "folderName": "28 - TRẦN THỊ HUYỀN"
  },
  {
    "stt": 29,
    "id": "GV029",
    "name": "HOÀNG THỊ HỒNG MINH",
    "role": "Giáo viên",
    "cccd": "038180015145",
    "phone": "0978129873",
    "folderName": "29 - HOÀNG THỊ HỒNG MINH"
  },
  {
    "stt": 30,
    "id": "GV030",
    "name": "NGUYỄN THỊ LOAN",
    "role": "Giáo viên",
    "cccd": "038183041857",
    "phone": "0944832468",
    "folderName": "30 - NGUYỄN THỊ LOAN"
  },
  {
    "stt": 31,
    "id": "GV031",
    "name": "NGUYỄN THỊ PHƯƠNG THÚY",
    "role": "Giáo viên",
    "cccd": "038184023774",
    "phone": "0984141436",
    "folderName": "31 - NGUYỄN THỊ PHƯƠNG THÚY"
  },
  {
    "stt": 32,
    "id": "GV032",
    "name": "PHAN THỊ QUỲNH",
    "role": "Giáo viên",
    "cccd": "040177008493",
    "phone": "0976420190",
    "folderName": "32 - PHAN THỊ QUỲNH"
  },
  {
    "stt": 33,
    "id": "GV033",
    "name": "LÊ THỊ ĐÀO",
    "role": "Giáo viên",
    "cccd": "040180006435",
    "phone": "0393760487",
    "folderName": "33 - LÊ THỊ ĐÀO"
  },
  {
    "stt": 34,
    "id": "GV034",
    "name": "NGUYỄN THỊ PHƯƠNG THẢO",
    "role": "Giáo viên",
    "cccd": "040183004369",
    "phone": "0368876776",
    "folderName": "34 - NGUYỄN THỊ PHƯƠNG THẢO"
  },
  {
    "stt": 35,
    "id": "GV035",
    "name": "ĐẶNG THỊ TRÀ",
    "role": "Giáo viên",
    "cccd": "040185005965",
    "phone": "0947657118",
    "folderName": "35 - ĐẶNG THỊ TRÀ"
  },
  {
    "stt": 36,
    "id": "GV036",
    "name": "TRẦN THỊ HOÀI",
    "role": "Giáo viên",
    "cccd": "040185007324",
    "phone": "0985707664",
    "folderName": "36 - TRẦN THỊ HOÀI"
  },
  {
    "stt": 37,
    "id": "GV037",
    "name": "PHAN VĂN TUẤN",
    "role": "Giáo viên",
    "cccd": "042069000730",
    "phone": "0978497471",
    "folderName": "37 - PHAN VĂN TUẤN"
  },
  {
    "stt": 38,
    "id": "GV038",
    "name": "THÁI BÁ VÂN",
    "role": "Giáo viên",
    "cccd": "042079001737",
    "phone": "0984717810",
    "folderName": "38 - THÁI BÁ VÂN"
  },
  {
    "stt": 39,
    "id": "GV039",
    "name": "HÀ VĂN TÝ",
    "role": "Giáo viên",
    "cccd": "042084002100",
    "phone": "0818810007",
    "folderName": "39 - HÀ VĂN TÝ"
  },
  {
    "stt": 40,
    "id": "GV040",
    "name": "HUỲNH THỊ CHƯƠNG",
    "role": "Giáo viên",
    "cccd": "042171002326",
    "phone": "0965337279",
    "folderName": "40 - HUỲNH THỊ CHƯƠNG"
  },
  {
    "stt": 41,
    "id": "GV041",
    "name": "LÊ THỊ KHÁNH TOÀN",
    "role": "Giáo viên",
    "cccd": "042178001912",
    "phone": "0388322238",
    "folderName": "41 - LÊ THỊ KHÁNH TOÀN"
  },
  {
    "stt": 42,
    "id": "GV042",
    "name": "NGUYỄN THỊ KIM THOA",
    "role": "Giáo viên",
    "cccd": "042178004373",
    "phone": "0338475333",
    "folderName": "42 - NGUYỄN THỊ KIM THOA"
  },
  {
    "stt": 43,
    "id": "GV043",
    "name": "PHẠM THỊ MỸ",
    "role": "Giáo viên",
    "cccd": "042182002611",
    "phone": "0931626649",
    "folderName": "43 - PHẠM THỊ MỸ"
  },
  {
    "stt": 44,
    "id": "GV044",
    "name": "NGUYỄN THỊ MINH",
    "role": "Giáo viên",
    "cccd": "042183003253",
    "phone": "0964812899",
    "folderName": "44 - NGUYỄN THỊ MINH"
  },
  {
    "stt": 45,
    "id": "GV045",
    "name": "PHẠM THỊ VINH",
    "role": "Giáo viên",
    "cccd": "042186002767",
    "phone": "0989909139",
    "folderName": "45 - PHẠM THỊ VINH"
  },
  {
    "stt": 46,
    "id": "GV046",
    "name": "DƯƠNG THỊ THÚY HẰNG",
    "role": "Giáo viên",
    "cccd": "042186002869",
    "phone": "0337284353",
    "folderName": "46 - DƯƠNG THỊ THÚY HẰNG"
  },
  {
    "stt": 47,
    "id": "GV047",
    "name": "MAI KẾ PHỤNG",
    "role": "Giáo viên",
    "cccd": "044076003274",
    "phone": "0935910989",
    "folderName": "47 - MAI KẾ PHỤNG"
  },
  {
    "stt": 48,
    "id": "GV048",
    "name": "NGUYỄN VĂN HIỆN",
    "role": "Giáo viên",
    "cccd": "045076000674",
    "phone": "0399109216",
    "folderName": "48 - NGUYỄN VĂN HIỆN"
  },
  {
    "stt": 49,
    "id": "GV049",
    "name": "HỒ THỊ MỸ LIÊN",
    "role": "Giáo viên",
    "cccd": "045180000533",
    "phone": "0976713177",
    "folderName": "49 - HỒ THỊ MỸ LIÊN"
  },
  {
    "stt": 50,
    "id": "GV050",
    "name": "NGUYỄN THỊ NHƯ",
    "role": "Giáo viên",
    "cccd": "045191000752",
    "phone": "0941357352",
    "folderName": "50 - NGUYỄN THỊ NHƯ"
  },
  {
    "stt": 51,
    "id": "GV051",
    "name": "TRƯƠNG THỊ MỸ NGỌC",
    "role": "Giáo viên",
    "cccd": "046179012821",
    "phone": "0931933058",
    "folderName": "51 - TRƯƠNG THỊ MỸ NGỌC"
  },
  {
    "stt": 52,
    "id": "GV052",
    "name": "NGUYỄN THỊ THANH HÀ",
    "role": "Giáo viên",
    "cccd": "049176011414",
    "phone": "0935098559",
    "folderName": "52 - NGUYỄN THỊ THANH HÀ"
  },
  {
    "stt": 53,
    "id": "GV053",
    "name": "PHẠM THỊ THANH THÚY",
    "role": "Giáo viên",
    "cccd": "049181000523",
    "phone": "0359757625",
    "folderName": "53 - PHẠM THỊ THANH THÚY"
  },
  {
    "stt": 54,
    "id": "GV054",
    "name": "PHAN THỊ DIỆU TÍN",
    "role": "Giáo viên",
    "cccd": "049181000989",
    "phone": "0374411356",
    "folderName": "54 - PHAN THỊ DIỆU TÍN"
  },
  {
    "stt": 55,
    "id": "GV055",
    "name": "LÊ THỊ TIẾP",
    "role": "Giáo viên",
    "cccd": "049183000984",
    "phone": "0986856987",
    "folderName": "55 - LÊ THỊ TIẾP"
  },
  {
    "stt": 56,
    "id": "GV056",
    "name": "LÊ VĂN TẦN",
    "role": "Giáo viên",
    "cccd": "051066001372",
    "phone": "0914157544",
    "folderName": "56 - LÊ VĂN TẦN"
  },
  {
    "stt": 57,
    "id": "GV057",
    "name": "TRẦN THÁNH TÔN",
    "role": "Giáo viên",
    "cccd": "051073012868",
    "phone": "0813636279",
    "folderName": "57 - TRẦN THÁNH TÔN"
  },
  {
    "stt": 58,
    "id": "GV058",
    "name": "TRƯƠNG THỊ MỸ HUỆ",
    "role": "Giáo viên",
    "cccd": "051178004769",
    "phone": "0398761874",
    "folderName": "58 - TRƯƠNG THỊ MỸ HUỆ"
  },
  {
    "stt": 59,
    "id": "GV059",
    "name": "NGUYỄN THỊ BÍCH HIỀN",
    "role": "Giáo viên",
    "cccd": "051177002574",
    "phone": "0868018918",
    "folderName": "59 - NGUYỄN THỊ BÍCH HIỀN"
  },
  {
    "stt": 60,
    "id": "GV060",
    "name": "VÕ THỊ TRINH",
    "role": "Giáo viên",
    "cccd": "051177002577",
    "phone": "0385888998",
    "folderName": "60 - VÕ THỊ TRINH"
  },
  {
    "stt": 61,
    "id": "GV061",
    "name": "NGUYỄN NGỌC HẢI",
    "role": "Giáo viên",
    "cccd": "052077002671",
    "phone": "0794536115",
    "folderName": "61 - NGUYỄN NGỌC HẢI"
  },
  {
    "stt": 62,
    "id": "GV062",
    "name": "LÊ THỊ HIỀN LƯƠNG",
    "role": "Giáo viên",
    "cccd": "052179008650",
    "phone": "0946145048",
    "folderName": "62 - LÊ THỊ HIỀN LƯƠNG"
  },
  {
    "stt": 63,
    "id": "GV063",
    "name": "LÊ THỊ CẨM HOÀI HƯNG",
    "role": "Giáo viên",
    "cccd": "052179013713",
    "phone": "0349907777",
    "folderName": "63 - LÊ THỊ CẨM HOÀI HƯNG"
  },
  {
    "stt": 64,
    "id": "GV064",
    "name": "HUỲNH THỊ TRANG",
    "role": "Giáo viên",
    "cccd": "052180001756",
    "phone": "0945886336",
    "folderName": "64 - HUỲNH THỊ TRANG"
  },
  {
    "stt": 65,
    "id": "GV065",
    "name": "PHẠM THỊ MỸ HẰNG",
    "role": "Tổ trưởng",
    "cccd": "052182001737",
    "phone": "0971496782",
    "folderName": "65 - PHẠM THỊ MỸ HẰNG"
  },
  {
    "stt": 66,
    "id": "GV066",
    "name": "ĐẶNG THỊ HỒNG NGUYÊN",
    "role": "Giáo viên",
    "cccd": "052185002753",
    "phone": "0706223057",
    "folderName": "66 - ĐẶNG THỊ HỒNG NGUYÊN"
  },
  {
    "stt": 67,
    "id": "GV067",
    "name": "LÊ THỊ THU TRANG",
    "role": "Giáo viên",
    "cccd": "056178001248",
    "phone": "0359955179",
    "folderName": "67 - LÊ THỊ THU TRANG"
  },
  {
    "stt": 68,
    "id": "GV068",
    "name": "NGUYỄN THẾ DŨNG",
    "role": "Giáo viên",
    "cccd": "062079000395",
    "phone": "0916877818",
    "folderName": "68 - NGUYỄN THẾ DŨNG"
  },
  {
    "stt": 69,
    "id": "GV069",
    "name": "ĐOÀN QUỐC VŨ",
    "role": "Giáo viên",
    "cccd": "062080000236",
    "phone": "0338566228",
    "folderName": "69 - ĐOÀN QUỐC VŨ"
  },
  {
    "stt": 70,
    "id": "GV070",
    "name": "NGUYỄN NGỌC TUÂN",
    "role": "Giáo viên",
    "cccd": "062083000445",
    "phone": "0975081283",
    "folderName": "70 - NGUYỄN NGỌC TUÂN"
  },
  {
    "stt": 71,
    "id": "GV071",
    "name": "ĐINH DUY TUẤN",
    "role": "Giáo viên",
    "cccd": "062083000592",
    "phone": "0344286113",
    "folderName": "71 - ĐINH DUY TUẤN"
  },
  {
    "stt": 72,
    "id": "GV072",
    "name": "VÕ VĂN HỒNG",
    "role": "Giáo viên",
    "cccd": "062085000580",
    "phone": "0965555717",
    "folderName": "72 - VÕ VĂN HỒNG"
  },
  {
    "stt": 73,
    "id": "GV073",
    "name": "VÕ HUY THIỆN",
    "role": "Giáo viên",
    "cccd": "062086006034",
    "phone": "0972343968",
    "folderName": "73 - VÕ HUY THIỆN"
  },
  {
    "stt": 74,
    "id": "GV074",
    "name": "ĐINH DUY NGỌC",
    "role": "Giáo viên",
    "cccd": "062096000213",
    "phone": "0968414629",
    "folderName": "74 - ĐINH DUY NGỌC"
  },
  {
    "stt": 75,
    "id": "GV075",
    "name": "HÀN THỊ TÚ UYÊN",
    "role": "Giáo viên",
    "cccd": "062177003130",
    "phone": "0983577316",
    "folderName": "75 - HÀN THỊ TÚ UYÊN"
  },
  {
    "stt": 76,
    "id": "GV076",
    "name": "VÕ THỊ YẾN LINH",
    "role": "Giáo viên",
    "cccd": "062177003398",
    "phone": "0915658509",
    "folderName": "76 - VÕ THỊ YẾN LINH"
  },
  {
    "stt": 77,
    "id": "GV077",
    "name": "NGUYỄN THỊ BÍCH PHƯƠNG",
    "role": "Giáo viên",
    "cccd": "062177004035",
    "phone": "0935402193",
    "folderName": "77 - NGUYỄN THỊ BÍCH PHƯƠNG"
  },
  {
    "stt": 78,
    "id": "GV078",
    "name": "VÕ THỊ THIỆN",
    "role": "Giáo viên",
    "cccd": "062179000604",
    "phone": "0935910173",
    "folderName": "78 - VÕ THỊ THIỆN"
  },
  {
    "stt": 79,
    "id": "GV079",
    "name": "NGUYỄN THỊ ÁI THÙY",
    "role": "Giáo viên",
    "cccd": "062179000685",
    "phone": "0774561752",
    "folderName": "79 - NGUYỄN THỊ ÁI THÙY"
  },
  {
    "stt": 80,
    "id": "GV080",
    "name": "LÊ THỊ MAI HOA",
    "role": "Giáo viên",
    "cccd": "062180002380",
    "phone": "0386127079",
    "folderName": "80 - LÊ THỊ MAI HOA"
  },
  {
    "stt": 81,
    "id": "GV081",
    "name": "HUỲNH THỊ LOAN",
    "role": "Giáo viên",
    "cccd": "062180002533",
    "phone": "0366097949",
    "folderName": "81 - HUỲNH THỊ LOAN"
  },
  {
    "stt": 82,
    "id": "GV082",
    "name": "TRẦN NGUYỄN THÚY QUỲNH",
    "role": "Giáo viên",
    "cccd": "062181000147",
    "phone": "0935099452",
    "folderName": "82 - TRẦN NGUYỄN THÚY QUỲNH"
  },
  {
    "stt": 83,
    "id": "GV083",
    "name": "PHÙNG THỊ THU",
    "role": "Giáo viên",
    "cccd": "062181000560",
    "phone": "0987285928",
    "folderName": "83 - PHÙNG THỊ THU"
  },
  {
    "stt": 84,
    "id": "GV084",
    "name": "HỒ THỊ THU HIỀN",
    "role": "Giáo viên",
    "cccd": "062182000216",
    "phone": "0987310178",
    "folderName": "84 - HỒ THỊ THU HIỀN"
  },
  {
    "stt": 85,
    "id": "GV085",
    "name": "LÊ THỊ TÌNH",
    "role": "Tổ trưởng",
    "cccd": "062182000507",
    "phone": "0911402009",
    "folderName": "85 - LÊ THỊ TÌNH"
  },
  {
    "stt": 86,
    "id": "GV086",
    "name": "NGUYỄN THỊ HỒNG THẮM",
    "role": "Giáo viên",
    "cccd": "062184000766",
    "phone": "0901958006",
    "folderName": "86 - NGUYỄN THỊ HỒNG THẮM"
  },
  {
    "stt": 87,
    "id": "GV087",
    "name": "PHAN THỊ THUẬN",
    "role": "Giáo viên",
    "cccd": "062185000683",
    "phone": "0974871222",
    "folderName": "87 - PHAN THỊ THUẬN"
  },
  {
    "stt": 88,
    "id": "GV088",
    "name": "HOÀNG THỊ NHÀN",
    "role": "Giáo viên",
    "cccd": "062185000807",
    "phone": "0911213435",
    "folderName": "88 - HOÀNG THỊ NHÀN"
  },
  {
    "stt": 89,
    "id": "GV089",
    "name": "LƯU THỊ MAI HƯƠNG",
    "role": "Giáo viên",
    "cccd": "062185001053",
    "phone": "0386090885",
    "folderName": "89 - LƯU THỊ MAI HƯƠNG"
  },
  {
    "stt": 90,
    "id": "GV090",
    "name": "LÊ THỊ KIM HƯƠNG",
    "role": "Giáo viên",
    "cccd": "062185001055",
    "phone": "0973824160",
    "folderName": "90 - LÊ THỊ KIM HƯƠNG"
  },
  {
    "stt": 91,
    "id": "GV091",
    "name": "NGUYỄN THỊ KIM OANH",
    "role": "Giáo viên",
    "cccd": "062187000839",
    "phone": "0981308055",
    "folderName": "91 - NGUYỄN THỊ KIM OANH"
  },
  {
    "stt": 92,
    "id": "GV092",
    "name": "LÊ THỊ DIỆU AN",
    "role": "Giáo viên",
    "cccd": "062187003785",
    "phone": "0379596129",
    "folderName": "92 - LÊ THỊ DIỆU AN"
  },
  {
    "stt": 93,
    "id": "GV093",
    "name": "NGUYỄN THỊ MẾN THƯƠNG",
    "role": "Giáo viên",
    "cccd": "062189000726",
    "phone": "0935449979",
    "folderName": "93 - NGUYỄN THỊ MẾN THƯƠNG"
  },
  {
    "stt": 94,
    "id": "GV094",
    "name": "DƯƠNG THỊ AN",
    "role": "Giáo viên",
    "cccd": "062191001409",
    "phone": "0398479907",
    "folderName": "94 - DƯƠNG THỊ AN"
  },
  {
    "stt": 95,
    "id": "GV095",
    "name": "PHẠM NHƯ QUỲNH",
    "role": "Giáo viên",
    "cccd": "062302007029",
    "phone": "0961778516",
    "folderName": "95 - PHẠM NHƯ QUỲNH"
  },
  {
    "stt": 96,
    "id": "GV096",
    "name": "HOÀNG THỊ LÝ",
    "role": "Giáo viên",
    "cccd": "062186006603",
    "phone": "0972079987",
    "folderName": "96 - HOÀNG THỊ LÝ"
  },
  {
    "stt": 97,
    "id": "GV097",
    "name": "VÕ THỊ THỦY",
    "role": "Giáo viên",
    "cccd": "062187004267",
    "phone": "0979675238",
    "folderName": "97 - VÕ THỊ THỦY"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEACHERS_DATABASE;
}
