<?php

class echosign {

	private $s;
	private $apikey;
	private $url='http://www.echosign.com/services/EchoSignDocumentService8?wsdl';

	public function __construct($apikey=null) {
		$f='./files/.echosignwsdl';
		if(!file_exists($f)) {
			file_put_contents($f,file_get_contents($this->url));
		}
		$this->apikey=$apikey;
		$this->s=new SOAPClient($f,array('trace'=>true,));
	}

	public function send($to,$filename,$contents) {
		$r = $this->s->sendDocument(array(
					'apiKey' => $this->apikey,
					'documentCreationInfo' => array(
						'fileInfos' => array(
							'FileInfo' => array(
								'file'     => $contents,
								'fileName' => $filename,
								'mimeType' => 'application/pdf',
								),
							),
						'name'    => "$filename",
						'message'=>'',
						'signatureFlow' => "SENDER_SIGNATURE_NOT_REQUIRED",
						'signatureType' => "ESIGN",
						'tos' => array( $to ),
						),
					)
				);

		return $r->documentKeys->DocumentKey->documentKey;
	}
}

class tsoap extends SOAPClient {

	public function __doRequest($request, $location, $action, $version, $oneway=0) { 
        $result = parent::__doRequest($request, $location, $action, $version,$oneway);
		echo htmlentities($result);
        return $result; 
    } 
}

?>
