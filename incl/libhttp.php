<?php

class http {
	
	private $_url;
	private $_ref;
	private $_post=array();
	private $_post_body;
	private $_put;
	private $_get=array();
	private $_headers=array();
	private $_code;
	private $_header;
	private $_response;
	private $_use_cache=false;
	private $_cache_timeout=3600;

	public function __construct($url=null) {
		$this->_url=$url;
	}

	public function execute() {
		$h=array();
		if(count($this->_headers)) {
			foreach($this->_headers as $k=>$v) {
				$h[]=$k.': '.$v;
			}
		}
		$ch = curl_init();
		$g=null;
		if(count($this->_get)) {
			$g='?';
			foreach($this->_get as $k=>$v) {
				$g.=urlencode($k).'='.urlencode($v).'&';
			}
		}
		if($this->_use_cache) {
			$cdir='./files/httpcache/';
			if(!is_dir($cdir)) mkdir($cdir);
			$key=md5($this->_url.$g);
			if(count($this->_post)) $key.='.'.md5(serialize($this->_post));
			if(file_exists($cdir.$key)) {
				$cont=file_get_contents($cdir.$key);
				$cont=unserialize($cont);
				$this->_code=$cont['code'];
				$this->_response=$cont['response'];
				$this->_header=$cont['headers'];
				return $this->_response;
			}
		}

		if(!empty($this->_ref)) curl_setopt($ch, CURLOPT_REFERER,$this>_ref);
		curl_setopt($ch, CURLOPT_URL,$this->_url.$g);
		curl_setopt($ch, CURLOPT_HEADER, 1);
		if(!empty($this->_post_body)) {
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $this->_post_body);
			$h[]='Content-Length: '.strlen($this->_post_body);
		}elseif(count($this->_post)) {
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $this->_post);
		}

		if($this->_put) {
			curl_setopt($ch,CURLOPT_PUT,1);
			$tmp=tmpfile();
			fwrite($tmp,$this->_put);
			fseek($tmp,0);
			curl_setopt($ch,CURLOPT_INFILE,$tmp);
			curl_setopt($ch, CURLOPT_INFILESIZE, strlen($this->_put));
		}

		if(count($h)) {
			curl_setopt($ch, CURLOPT_HTTPHEADER, $h);
		}

		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		$response = curl_exec($ch); 
		curl_close($ch);
		if($this->_put) fclose($tmp);
		
		// Split response into header and body sections
		if($response==false) {
			$this->_code=404;
			$this->_response=null;
			$this->_header=null;
			return null;
		}
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

		$this->_code=$response_code;
		$this->_header=$response_header_array;
		$this->_response=trim($response_body);
		if($this->_use_cache) {
			file_put_contents($cdir.$key,serialize(array('code'=>$this->_code,'response'=>$this->_response,'headers'=>$this->_header)));
		}
		return $this->_response;
	}

	public function add_get($key=null,$value=null) {
		if($key===null) {
			$this->_get=array();
			return;
		}

		if($value===null) {
			if(isset($this->_get[$key])) unset($this->_get[$key]);
			return;
		}
		
		$this->_get[$key]=$value;
	}

	public function add_post($key=null,$value=null) {
		if($key===null) {
			$this->_post=array();
			return;
		}

		if($value===null) {
			$this->_post_body=$key;
			return;
		}
		
		$this->_post[$key]=$value;
	}
	
	public function add_put($data) {
		$this->_put=$data;
	}
	
	public function add_header($key=null,$value=null) {
		if($key===null) {
			$this->_headers=array();
			return;
		}

		if($value===null) {
			if(isset($this->_headers[$key])) unset($this->_headers[$key]);
			return;
		}
		
		$this->_headers[$key]=$value;
	}
	
	public function add_referer($ref=null) {
		if($ref=null) $ref='http://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];
		$this->_ref=$ref;
	}

	public function use_cache($use=true) {
		$this->_use_cache=(bool)$use;
	}
		
	public function __get($key) {
		switch($key) {
			case 'code':
			return $this->_code;
			break;

			case 'headers':
			return $this->_header;
			break;

			case 'response':
			return $this->_response;
			break;
		}
		return null;
	}
	
	public function clear($url=null) {
	}
	
}
?>
