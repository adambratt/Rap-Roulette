<?php

class gdoc {

	private $_headers=array();
	private $_post=array();
	private $_url='';
	private $_login_url='https://www.google.com/accounts/ClientLogin';
	private $_email;
	private $_password;
	private $_token;
	private $_docdata=array();
	private $s;
	private $_types=array();

	public function __construct($id=null) {
		$cfg=config::get_class_config('gdoc');
		$skey='_sess_gdoc';
		if(!isset($_SESSION[$skey])) $_SESSION[$skey]=array();
		$this->s=&$_SESSION[$skey];
		$this->_email=$cfg['email'];
		$this->_password=$cfg['password'];
		$this->set_header('GData-Version: 3.0');
		if($id!==null) $this->load($id);
	}
	
	static public function get_list() {
		$doc=new self();
		if(!$doc->logged_in()) $doc->login();
		$h=new http('https://docs.google.com/feeds/default/private/full/folder%3A0Bx1tzOmilXiEZDVjOGRlNWQtYmRmYi00N2EwLTlkYWUtNGE2MTRiMGM4Njc0/contents');
		$h->add_header('GData-Version','3.0');
		$h->add_header('Authorization','GoogleLogin auth='.$doc->s['token']);
		$out=$h->execute();
		if($h->code!=200) throw new Exception($out);
		$docs=$doc->parse_files($out);
		$out=array();
		foreach($docs as $a) {
			$i=count($out);
			foreach($a as $k=>$v) {
				$out[$i][$k]=(string)$v;
			}
		}
		return $out;
	}

	public function download($dtype=null) {
		$types=array('html','doc','odt','pdf','png','rtf','txt','zip');
		if(!$this->logged_in()) $this->login();
		list($type,$id)=explode(':',$this->id);
		$h=new http('https://docs.google.com/feeds/download/documents/Export');
		$h->add_get('id',$id);
		if($type && in_array($dtype,$types)) $h->add_get('exportFormat',$dtype);
		$h->add_header('GData-Version','3.0');
		$h->add_header('Authorization','GoogleLogin auth='.$this->s['token']);
		$out=$h->execute(); // Todo: get return code, check for errors
		return $out;
	}
	
	public function upload($content,$type='html') {
		if(!$this->logged_in()) $this->login();
		$h=new http($this->link['edit-media']);
		$h->add_header('GData-Version','3.0');
		$h->add_header('Authorization','GoogleLogin auth='.$this->s['token']);
		$h->add_header('If-Match',$this->etag);
		$h->add_header('Content-Type',$this->get_mime($type));
		$h->add_header('Slug',$this->title.' v2');
		$h->add_put($content);
		$out=$h->execute();
		$out=$this->parse_files($out);
	}

	public function load($id) {
		if(!$this->logged_in()) $this->login();
		$h=new http('https://docs.google.com/feeds/default/private/full/'.$id);
		$h->add_header('GData-Version','3.0');
		$h->add_header('Authorization','GoogleLogin auth='.$this->s['token']);
		$in=$h->execute();
		if($h->code!='200') throw new Exception('Document not found');
		$this->load_data($this->parse_files($in));
	}

	public function load_data($data) {
		$this->_docdata=$data;
	}

	public function copy($title=null) {
		if(!$this->logged_in()) $this->login();
		$h=new http('https://docs.google.com/feeds/default/private/full/');
		$h->add_header('GData-Version','3.0');
		$h->add_header('Authorization','GoogleLogin auth='.$this->s['token']);
		$h->add_header('Content-Type','application/atom+xml');
		$in='<?xml version="1.0" encoding="UTF-8"?><entry xmlns="http://www.w3.org/2005/Atom"><category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/docs/2007#document"/><id>'.$this->link['self'].'</id><title>'.htmlentities($title).'</title></entry>';
		$h->add_post($in);
		$out=$h->execute();
		
		$out=$this->parse_files($out);
		$doc=new self();
		$doc->load_data($out);
		return $doc;
	}

	public function login($email=null,$password=null) {
		if($email==null) {
			$email=$this->_email;
			$password=$this->_password;
		}
		$post=array();
		$post['service']='writely';
		$post['accountType']='HOSTED';
		$post['Email']=$email;
		$post['Passwd']=$password;
		$post['source']='pnb-contractgen-1';
		$h=new http($this->_login_url);
		foreach($post as $k=>$v) {
			$h->add_post($k,$v);
		}
		$out=$h->execute();
		if($h->code=='403') throw new Exception($out);
		$tmp=explode("\n",$out);
		$r=array();
		foreach($tmp as $a) {
			list($k,$v)=explode('=',$a);
			$r[$k]=$v;
		}
		if(isset($r['Auth'])) $this->s['token']=$r['Auth'];
	}

	private function execute($url=null,$post=array()) {
		$h=$this->_headers;
		if(isset($this->s['token'])) $h[]='Authorization: GoogleLogin auth='.$this->s['token'];
		if($url==null) $url=$this->_url;
		$ch = curl_init();
		
		curl_setopt($ch, CURLOPT_URL,$url);
		curl_setopt($ch, CURLOPT_HEADER, 1);
		if(count($h)) {
			curl_setopt($ch, CURLOPT_HTTPHEADER, $h);
		}
		if(count($post)) {
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
		}
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		$response = curl_exec($ch); 
		curl_close($ch);
		
		// Split response into header and body sections 
		list($response_headers, $response_body) = explode("\r\n\r\n", $response, 2); 
		$response_header_lines = explode("\r\n", $response_headers); 

		// First line of headers is the HTTP response code 
		$http_response_line = array_shift($response_header_lines); 
		if(preg_match('@^HTTP/[0-9]\.[0-9] ([0-9]{3})@',$http_response_line, $matches)) { $response_code = $matches[1]; } 

		// put the rest of the headers in an array 
		$response_header_array = array(); 
		foreach($response_header_lines as $header_line) { 
			list($header,$value) = explode(': ', $header_line, 2);
			if(!isset($response_header_array[$header])) $response_header_array[$header]=array();
			$response_header_array[$header][] = $value; 
		}

		return array("code" => $response_code, "header" => $response_header_array, "body" => trim($response_body));
	}

	private function set_post($key=null,$value=null) {
		if($key==null) {
			$this->_post=array();
			return;
		}
		if($value===null && isset($this->_post[$key])) {
			unset($this->_post[$key]);
			return;
		}
		$this->_post[$key]=$value;
	}

	public function set_header($key=null) {
		if($key==null) {
			$this->_headers=array();
			return;
		}
		$this->_headers[]=$key;
	}
	
	public function logged_in() {
		return !(empty($this->s['token']));
	}
	
	private function get_mime($type) {
		switch($type) {
			case 'CSV':
			return 'text/csv';

			case 'TSV':
			case 'TAB':
			return 'text/tab-separated-values';

			case 'DOC':
			return 'application/msword';

			case 'DOCX':
			return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

			case 'ODS':
			return 'application/x-vnd.oasis.opendocument.spreadsheet';

			case 'ODT':
			return 'application/vnd.oasis.opendocument.text';

			case 'RTF':
			return 'application/rtf';

			case 'SXW':
			return 'application/vnd.sun.xml.writer';
			
			case 'TXT':
			return 'text/plain';

			case 'XLS':
			return 'application/vnd.ms-excel';

			case 'XLSX':
			return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

			case 'PDF':
			return 'application/pdf';

			case 'PPT':
			case 'PPS':
			return 'application/vnd.ms-powerpoint';

			default:
			return 'text/html';
		}
	}
	
	public function parse_files($in) {
		$xml=new SimpleXMLElement($in,LIBXML_NSCLEAN);
		$namespaces = $xml->getNamespaces(true); 

		//Register them with their prefixes 
		foreach ($namespaces as $prefix => $ns) { 
			$xml->registerXPathNamespace($prefix, $ns); 
		} 

		$docs=array();
		$k='gd:resourceId';
		if($xml->getName()=='entry') {
			$i=count($docs);
			$att=$xml->attributes('gd',true);
			foreach($att as $k=>$v) {
				$docs[$i][$k]=$v;
			}
			foreach($xml as $k=>$v) {
				if($k=='link') {
					if(!isset($docs[$i][$k])) $docs[$i][$k]=array();
					$docs[$i][$k][(string)$v['rel']]=(string)$v['href'];
					continue;
				}
				if($k=='author') {
					$docs[$i][$k]=array();
					foreach($v as $c=>$b) {
						$docs[$i][$k][$c]=(string)$b;
					}
					continue;
				}
				$docs[$i][$k]=(string)$v;
			}
			$docs[$i]['content']=(string)$xml->content['src'];
			$docs[$i]['id']=(string)$xml->children('gd',true)->resourceId;
			return $docs[0];
		}
		foreach($xml->entry as $a) {
			$i=count($docs);
			$att=$a->attributes('gd',true);
			foreach($att as $k=>$v) {
				$docs[$i][$k]=$v;
			}
			foreach($a as $k=>$v) {
				if($k=='link' || $k=='category' || $k=='author') {
					$docs[$i][$k]=array();
					foreach($v as $c=>$b) {
						$docs[$i][$k][$c]=(string)$b;
					}
					continue;
				}
				$docs[$i][$k]=(string)$v;
			}
			$docs[$i]['content']=(string)$a->content['src'];
			$docs[$i]['id']=(string)$a->children('gd',true)->resourceId;
			//$docs[]=array('title'=>(string)$a->title,'id'=>(string)$a->children('gd',true)->resourceId,'content'=>(string)$a->content['src']);
		}
		return $docs;
	}
	
	public function __get($key) {
		switch($key) {
			case 'contents':
			return $this->download();
			break;
		}

		if(isset($this->_docdata[$key])) return $this->_docdata[$key];
		return null;
	}

	public function __set($key,$value) {
		switch($key) {
			case 'title':
			break;

			case 'contents':
			$this->upload($value);
			break;
		}
	}

}

?>
