'use client';

import { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
  Alert,
  Image,
  Tabs,
  Tab,
} from 'react-bootstrap';
import DatePicker, { registerLocale } from 'react-datepicker';
import { th } from 'date-fns/locale/th';
import 'react-datepicker/dist/react-datepicker.css';

// Register Thai locale
registerLocale('th', th);

// Define types for form data
type FormData = {
  url: string;
  expiresAt: Date | null;
  text: string;
  wifi: {
    ssid: string;
    password: string;
    encryption: 'WPA' | 'WEP' | 'nopass';
  };
  email: {
    to: string;
    subject: string;
    body: string;
  };
};

type PayloadData = 
    | { url: string; expiresAt: string | null }
    | { text: string }
    | FormData['wifi']
    | FormData['email'];

export default function Home() {
  const [activeTab, setActiveTab] = useState('url');
  const [formData, setFormData] = useState<FormData>({
    url: '',
    expiresAt: null,
    text: '',
    wifi: { ssid: '', password: '', encryption: 'WPA' },
    email: { to: '', subject: '', body: '' },
  });
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#FFFFFF');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [shortUrl, setShortUrl] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const [category, field] = name.split('.');

    if (field && (category === 'wifi' || category === 'email')) {
      setFormData(prev => {
        const prevCategory = prev[category as keyof FormData];
        if (typeof prevCategory === 'object' && prevCategory !== null) {
          return {
            ...prev,
            [category]: {
              ...prevCategory,
              [field]: value,
            },
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setQrCode('');
    setShortUrl('');

    let payloadData: PayloadData;
    switch (activeTab) {
        case 'url':
            if (!formData.url) {
                setError('URL is required.');
                setIsLoading(false);
                return;
            }
            payloadData = { url: formData.url, expiresAt: formData.expiresAt ? formData.expiresAt.toISOString() : null };
            break;
        case 'text':
            if (!formData.text) {
                setError('Text is required.');
                setIsLoading(false);
                return;
            }
            payloadData = { text: formData.text };
            break;
        case 'wifi':
             if (!formData.wifi.ssid) {
                setError('Network Name (SSID) is required.');
                setIsLoading(false);
                return;
            }
            payloadData = formData.wifi;
            break;
        case 'email':
            if (!formData.email.to) {
                setError('Recipient email is required.');
                setIsLoading(false);
                return;
            }
            payloadData = formData.email;
            break;
        default:
            setError('Invalid QR Code type.');
            setIsLoading(false);
            return;
    }

    const payload = {
        qrDataType: activeTab,
        data: payloadData,
        colors: { dark: darkColor, light: lightColor },
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setQrCode(data.qrCode);
      if (data.shortUrl) {
        setShortUrl(data.shortUrl);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h1 className="text-center mb-4">QR Code Generator</h1>
              <Form onSubmit={handleSubmit}>
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'url')} id="qr-code-type-tabs" className="mb-3" fill>
                  <Tab eventKey="url" title="URL">
                    <Form.Group className="mb-3" controlId="formUrl">
                      <Form.Label>Enter URL</Form.Label>
                      <Form.Control type="url" name="url" placeholder="https://example.com" value={formData.url} onChange={handleInputChange} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formExpiresAt">
                      <Form.Label>Expiration Date (Optional)</Form.Label>
                      <DatePicker 
                        locale="th"
                        selected={formData.expiresAt} 
                        onChange={(date: Date | null) => setFormData(p => ({...p, expiresAt: date}))} 
                        showTimeSelect 
                        timeFormat="HH:mm"
                        timeIntervals={15} 
                        dateFormat="d MMMM yyyy, HH:mm น."
                        className="form-control" 
                        placeholderText="เลือกวันที่และเวลา"
                        minDate={new Date()} 
                        isClearable 
                      />
                    </Form.Group>
                  </Tab>
                  <Tab eventKey="text" title="Text">
                     <Form.Group className="mb-3" controlId="formText">
                        <Form.Label>Enter Text</Form.Label>
                        <Form.Control as="textarea" rows={3} name="text" value={formData.text} onChange={handleInputChange} />
                    </Form.Group>
                  </Tab>
                  <Tab eventKey="wifi" title="Wi-Fi">
                    <Form.Group className="mb-3" controlId="formWifiSSID">
                        <Form.Label>Network Name (SSID)</Form.Label>
                        <Form.Control type="text" name="wifi.ssid" value={formData.wifi.ssid} onChange={handleInputChange} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formWifiPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" name="wifi.password" value={formData.wifi.password} onChange={handleInputChange} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formWifiEncryption">
                        <Form.Label>Encryption</Form.Label>
                        <Form.Select name="wifi.encryption" value={formData.wifi.encryption} onChange={handleInputChange}>
                            <option value="WPA">WPA/WPA2</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">None</option>
                        </Form.Select>
                    </Form.Group>
                  </Tab>
                  <Tab eventKey="email" title="Email">
                     <Form.Group className="mb-3" controlId="formEmailTo">
                        <Form.Label>To</Form.Label>
                        <Form.Control type="email" name="email.to" value={formData.email.to} onChange={handleInputChange} />
                    </Form.Group>
                     <Form.Group className="mb-3" controlId="formEmailSubject">
                        <Form.Label>Subject</Form.Label>
                        <Form.Control type="text" name="email.subject" value={formData.email.subject} onChange={handleInputChange} />
                    </Form.Group>
                     <Form.Group className="mb-3" controlId="formEmailBody">
                        <Form.Label>Body</Form.Label>
                        <Form.Control as="textarea" rows={2} name="email.body" value={formData.email.body} onChange={handleInputChange} />
                    </Form.Group>
                  </Tab>
                </Tabs>

                <h5 className="mt-4">Customization</h5>
                 <Row>
                    <Col>
                        <Form.Group className="mb-3" controlId="formDarkColor">
                            <Form.Label>Dots Color</Form.Label>
                            <Form.Control type="color" value={darkColor} onChange={(e) => setDarkColor(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className="mb-3" controlId="formLightColor">
                            <Form.Label>Background Color</Form.Label>
                            <Form.Control type="color" value={lightColor} onChange={(e) => setLightColor(e.target.value)} />
                        </Form.Group>
                    </Col>
                </Row>

                <div className="d-grid mt-3">
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span className="ms-2">Generating...</span>
                      </>
                    ) : (
                      'Generate QR Code'
                    )}
                  </Button>
                </div>
              </Form>

              {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

              {qrCode && (
                <div className="text-center mt-4">
                  <h3 className="mb-3">Your QR Code is Ready!</h3>
                  <Image src={qrCode} alt="Generated QR Code" fluid rounded />
                  {shortUrl && <p className="mt-3">Short URL: <a href={shortUrl} target="_blank" rel="noopener noreferrer">{shortUrl}</a></p>}
                  <a href={qrCode} download="qrcode.png" className="btn btn-success mt-2">Download QR Code</a>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}