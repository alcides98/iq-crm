import requests
from django.conf import settings


class SifenClient:
    BASE_URL_TEST = 'https://eihapy.set.gov.py/api/v1'
    BASE_URL_PROD = 'https://ekuatia.set.gov.py/api/v1'

    def __init__(self):
        self.base_url = self.BASE_URL_PROD if settings.SIFEN_PRODUCTION else self.BASE_URL_TEST
        self.cert_path = settings.SIFEN_CERT_PATH
        self.cert_password = settings.SIFEN_CERT_PASSWORD
        self.ruc = settings.SIFEN_RUC

    def generate_de_xml(self, invoice, client, items):
        """Generar XML del Documento Electrónico según esquema SET"""
        raise NotImplementedError('Implementar según manual técnico SIFEN vigente')

    def sign_xml(self, xml_string):
        """Firmar XML con certificado digital XAdES-BES"""
        try:
            from signxml import XMLSigner
            signer = XMLSigner()
            # Cargar certificado .p12 y firmar
            raise NotImplementedError('Configurar con certificado SIFEN real')
        except ImportError:
            raise RuntimeError('Instalar signxml para firma digital')

    def send_de(self, signed_xml):
        response = requests.post(
            f'{self.base_url}/de/einvoice',
            data=signed_xml,
            headers={'Content-Type': 'application/xml'},
            cert=(self.cert_path, self.cert_password),
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    def get_kude(self, cdc):
        response = requests.get(
            f'{self.base_url}/de/kude/{cdc}',
            cert=(self.cert_path, self.cert_password),
            timeout=30,
        )
        response.raise_for_status()
        return response.content

    def cancel_de(self, cdc, motive):
        response = requests.post(
            f'{self.base_url}/de/cancel',
            json={'cdc': cdc, 'motivo': motive},
            cert=(self.cert_path, self.cert_password),
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
