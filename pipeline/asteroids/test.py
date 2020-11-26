import unittest
from process import *


class TestUnpackFunctions(unittest.TestCase):
    def test_packed_letter_to_number(self):
        self.assertEqual(packed_letter_to_number('1'), '01')
        self.assertEqual(packed_letter_to_number('9'), '09')
        self.assertEqual(packed_letter_to_number('A'), '10')
        self.assertEqual(packed_letter_to_number('I'), '18')
        self.assertEqual(packed_letter_to_number('J'), '19')
        self.assertEqual(packed_letter_to_number('K'), '20')
        self.assertEqual(packed_letter_to_number('V'), '31')
        self.assertEqual(packed_letter_to_number('a'), '36')
        self.assertEqual(packed_letter_to_number('f'), '41')
        self.assertEqual(packed_letter_to_number('z'), '61')

        self.assertRaises(ValueError, packed_letter_to_number, '$')
        self.assertRaises(ValueError, packed_letter_to_number, ':')
        self.assertRaises(ValueError, packed_letter_to_number, '"')
        self.assertRaises(TypeError, packed_letter_to_number, 'hh')
        self.assertRaises(TypeError, packed_letter_to_number, 'hello there!')

    def test_unpack_designation(self):
        # From MPC website
        self.assertEqual(unpack_designation('J95X00A'), '1995 XA')
        self.assertEqual(unpack_designation('J95X01L'), '1995 XL1')
        self.assertEqual(unpack_designation('J95F13B'), '1995 FB13')
        self.assertEqual(unpack_designation('J98SA8Q'), '1998 SQ108')
        self.assertEqual(unpack_designation('J98SC7V'), '1998 SV127')
        self.assertEqual(unpack_designation('J98SG2S'), '1998 SS162')
        self.assertEqual(unpack_designation('J98SG2S'), '1998 SS162')
        self.assertEqual(unpack_designation('K99AJ3Z'), '2099 AZ193')
        self.assertEqual(unpack_designation('K08Aa0A'), '2008 AA360')
        self.assertEqual(unpack_designation('K07Tf8A'), '2007 TA418')
        self.assertEqual(unpack_designation('K07Tf8A'), '2007 TA418')
        self.assertEqual(unpack_designation('PLS2040'), '2040 P-L')
        self.assertEqual(unpack_designation('T1S3138'), '3138 T-1')
        self.assertEqual(unpack_designation('T2S1010'), '1010 T-2')
        self.assertEqual(unpack_designation('T3S4101'), '4101 T-3')
        self.assertEqual(unpack_designation('03202'), '3202')
        self.assertEqual(unpack_designation('A0345'), '100345')
        self.assertEqual(unpack_designation('a0017'), '360017')
        self.assertEqual(unpack_designation('K3289'), '203289')
        self.assertEqual(unpack_designation('~0000'), '620000')
        self.assertEqual(unpack_designation('~000z'), '620061')
        self.assertEqual(unpack_designation('~AZaz'), '3140113')
        self.assertEqual(unpack_designation('~zzzz'), '15396335')

    def test_unpack_epoch(self):
        # From MPC website
        self.assertEqual(unpack_epoch('J9611'), '1996-01-01')
        self.assertEqual(unpack_epoch('J961A'), '1996-01-10')
        self.assertEqual(unpack_epoch('J969U'), '1996-09-30')
        self.assertEqual(unpack_epoch('J96A1'), '1996-10-01')
        self.assertEqual(unpack_epoch('K01AM'), '2001-10-22')

        self.assertEqual(unpack_epoch('K1811'), '2018-01-01')
        self.assertEqual(unpack_epoch('K181V'), '2018-01-31')
        self.assertEqual(unpack_epoch('J9777'), '1997-07-07')
        self.assertEqual(unpack_epoch('I976C'), '1897-06-12')
        self.assertEqual(unpack_epoch('K162T'), '2016-02-29')

    def test_unpack_uncertainty_parameter(self):
        self.assertEqual(unpack_uncertainty_parameter('1'), (1, ''))
        self.assertEqual(unpack_uncertainty_parameter('2'), (2, ''))
        self.assertEqual(unpack_uncertainty_parameter('5'), (5, ''))
        self.assertEqual(unpack_uncertainty_parameter('9'), (9, ''))
        self.assertEqual(unpack_uncertainty_parameter('E'), (-1, 'E'))
        self.assertEqual(unpack_uncertainty_parameter('D'), (-1, 'D'))
        self.assertEqual(unpack_uncertainty_parameter('F'), (-1, 'F'))

    def test_unpack_flags(self):
        self.assertEqual(unpack_flags('5801'), (1, 1, 1, 0, 1, 0))
        self.assertEqual(unpack_flags('5FC1'), (1, 1, 1, 0, 1, 0))
        self.assertEqual(unpack_flags('5FCA'), (10, 1, 1, 0, 1, 0))
        self.assertEqual(unpack_flags('5FCA'), (10, 1, 1, 0, 1, 0))
        self.assertEqual(unpack_flags('A001'), (1, 0, 0, 1, 0, 1))
        self.assertEqual(unpack_flags('A00A'), (10, 0, 0, 1, 0, 1))
        self.assertEqual(unpack_flags('A54A'), (10, 0, 0, 1, 0, 1))


if __name__ == '__main__':
    unittest.main()
