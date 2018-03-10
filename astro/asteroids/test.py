# for testing epoch_letter_to_number
# months_days = {
#     '1' : '01',
#     '2' : '02',
#     '3' : '03',
#     '4' : '04',
#     '5' : '05',
#     '6' : '06',
#     '7' : '07',
#     '8' : '08',
#     '9' : '09',
#     'A' : '10',
#     'B' : '11',
#     'C' : '12',
#     'D' : '13',
#     'E' : '14',
#     'F' : '15',
#     'G' : '16',
#     'H' : '17',
#     'I' : '18',
#     'J' : '19',
#     'K' : '20',
#     'L' : '21',
#     'M' : '22',
#     'N' : '23',
#     'O' : '24',
#     'P' : '25',
#     'Q' : '26',
#     'R' : '27',
#     'S' : '28',
#     'T' : '29',
#     'U' : '30',
#     'V' : '31',
# }

import unittest
from get_small_bodies import *

class TestUnpackFunctions(unittest.TestCase):

    def test_packed_letter_to_number(self):
        self.assertEqual(packed_letter_to_number('1'), '01')
        self.assertEqual(packed_letter_to_number('9'), '09')
        self.assertEqual(packed_letter_to_number('A'), '10')
        self.assertEqual(packed_letter_to_number('I'), '18')
        self.assertEqual(packed_letter_to_number('J'), '19')
        self.assertEqual(packed_letter_to_number('K'), '20')
        self.assertEqual(packed_letter_to_number('V'), '31')




if __name__ == '__main__':
    unittest.main()
