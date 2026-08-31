import io
import unittest

from app import app


class AppRouteTests(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_health_endpoint(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['status'], 'ok')

    def test_analyze_requires_image(self):
        response = self.client.post('/analyze')
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json)

    def test_analyze_rejects_non_image_extension(self):
        response = self.client.post(
            '/analyze',
            data={'image': (io.BytesIO(b'not an image'), 'notes.txt')},
            content_type='multipart/form-data'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('غير مدعوم', response.json['error'])


if __name__ == '__main__':
    unittest.main()