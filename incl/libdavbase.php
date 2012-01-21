<?php

class davbase extends modbase {

	protected $status='HTTP/1.1 200 OK';

	public function call($method='default_method',$method_args=NULL) {
		$request=substr($_SERVER['REQUEST_URI'],strlen(UBASE.'dav')+1);
		if(!strlen($request)) $request='/';
		ob_start();
		$this->auth=auth::get_instance();
		$this->db=PDOclass::get_instance();
		$req=$_SERVER['REQUEST_METHOD'];
		$req=strtolower($req);
		$out=call_user_func_array(array($this,$req),array($request));
		header('Content-Type: application/xml; charset="utf-8"');
		header($this->status);
		header('Content-Length: '.strlen($out));
		ob_clean();
		echo $out;
		exit;
	}

	protected function get($path) {
		$pa=explode('/',$path);
		if($pa[0]=='modules') return $this->modules_get($path);
		if($pa[0]=='logs') return $this->logs_get($path);
	}

	protected function put() {
	}

	protected function options() {
		$this->log_event('Sending options');
		header("MS-Author-Via: DAV");
		header('DAV: 1');
		header('Allow: OPTIONS, GET, PUT, PROPFIND< PROPPATCH, ACL');
		$null='<?xml version="1.0" encoding="utf-8" ?>
			<D:options-response xmlns:D="DAV:"></D:options-response>';
	}

	protected function propfind($path='/') {
		$pa=explode('/',$path);

		if($pa[0]=='modules') return $this->modules($path);
		if($pa[0]=='logs') return $this->logs($path);

		$out=array(
			array('type'=>'dir','url'=>'http://'.url('dav','modules')),
			array('type'=>'dir','url'=>'http://'.url('dav','logs')),
		);

		return $this->proplist($out);
	}

	protected function proplist($data) {
		$in='<D:multistatus xmlns:D=\'DAV:\'></D:multistatus>';
		$xml=new SimpleXMLElement($in);
		foreach($data as $k=>$a) {
			$resp=$xml->addChild('D:response');
			$resp->addChild('D:href',$a['url']);
			$propstat=$resp->addChild('D:propstat');
			$prop=$propstat->addChild('D:prop');
			foreach($a as $k=>$v) {
				if($k=='type' || $k=='url') continue;
				$prop->addChild('D:'.$k,$v);
			}
			$rtype=$prop->addChild('D:resourcetype');
			if($a['type']=='dir') $rtype->addChild('D:collection');
			$propstat->addChild('D:status','HTTP/1.1 200 OK');
		}

		return $xml->asXML();
	}

	protected function authorize() {
		if(!isset($_SERVER['PHP_AUTH_USER'])) {
			header('HTTP/1.0 401 UNAUTHORIZED');
			header('WWW-Authenticate: Basic realm="NOT SECURE, submitting password not recommended"');
			exit;
		}

		$auth=new auth();
		try{
			$auth->login($_SERVER['PHP_AUTH_USER'],$_SERVER['PHP_AUTH_PW']);
		}catch(Exception $e) {
			header('HTTP/1.0 401 UNAUTHORIZED');
			header('WWW-Authenticate: Basic realm="NOT SECURE, submitting password not recommended"');
			exit;
		}
	}

	public function log_event($data,$header='Log Data') {
		if(is_array($data)) $data=var_export($data,true);
		$fp=fopen('files/tmp.txt','a');
		fwrite($fp,"\n========= $header =============\n");
		fwrite($fp,$data."\n");
		fclose($fp);
	}
	
	/* Exported services */

	protected function modules($path) {
		if(substr($path,0,1)=='/') $path=substr($path,1);
		if(is_dir('db://'.$path) && substr($path,-1)!='/') $path.='/';
		$files=scandir('db://'.$path);
		$this->log_event($path);
		$rpath='db://'.$path;
		if(!is_dir($rpath)) return $this->proplist(array());
		$data=array();
		foreach($files as $a) {
			$i=count($data);
			$data[$i]['type']=filetype($rpath.$a);
			$data[$i]['url']='http://'.url('dav',$path,$a);
		}

		$out=$this->proplist($data);
		return $out;
	}

	protected function modules_get($path) {
		if(is_file('db://'.$path)) {
			header('Content-Type: '.$this->finfo($path));
			header('Content-Length: '.filesize('db://'.$path));
			$fp=fopen('db://'.$path,'r');
			fpassthru($fp);
			fclose($fp);
			exit;
		}
	}

	protected function modules_put($path) {
	}

	protected function finfo($fname) {
		$out=explode('.',$fname);
		$ext=array_pop($out);
		$ext=strtolower($ext);

        switch($ext)
         {
			case 'js' :
			return 'application/x-javascript';

			case 'json' :
			return 'application/json';

			// images
			case 'jpg' :
			case 'jpeg' :
			case 'jpe' :
			return 'image/jpg';

			case 'png' :
			case 'gif' :
			case 'bmp' :
			case 'tiff' :
			case 'tif' :
			return 'image/'.$ext;

			case 'ico' :
			return 'image/vnd.microsoft.icon';

			case 'svg' :
			case 'svgz' :
			return 'image/svg+xml';
			// images

			case 'css' :
			return 'text/plain';

			case 'xml' :
			return 'application/xml';

			case 'doc' :
			case 'docx' :
			return 'application/msword';

			case 'xls' :
			case 'xlt' :
			case 'xlm' :
			case 'xld' :
			case 'xla' :
			case 'xlc' :
			case 'xlw' :
			case 'xll' :
			return 'application/vnd.ms-excel';

			case 'ppt' :
			case 'pps' :
			return 'application/vnd.ms-powerpoint';

			case 'rtf' :
			return 'application/rtf';

			// adobe
			case 'pdf' :
			return 'application/pdf';
			case 'psd' :
			return 'image/vnd.adobe.photoshop';
			case 'ai' :
			return 'application/postscript';
			case 'eps' :
			return 'application/postscript';
			case 'ps' :
			return 'application/postscript';


			case 'html' :
			case 'htm' :
			case 'php' :
			return 'text/html';

			case 'txt' :
			return 'text/plain';

			case 'mpeg' :
			case 'mpg' :
			case 'mpe' :
			return 'video/mpeg';

			case 'mp3' :
			return 'audio/mpeg3';

			case 'wav' :
			return 'audio/wav';

			case 'aiff' :
			case 'aif' :
			return 'audio/aiff';

			case 'avi' :
			return 'video/msvideo';

			case 'wmv' :
			return 'video/x-ms-wmv';

			case 'mov' :
			return 'video/quicktime';

			case 'zip' :
			return 'application/zip';

			case 'tar' :
			return 'application/x-tar';

			case 'swf' :
			return 'application/x-shockwave-flash';

			case 'flv' :
			return 'video/x-flv';
		 }

		return 'application/octet-stream';
	}

	protected function logs($path) {
		if($path=='logs') return $this->proplist(array(array('type'=>'file','url'=>'http://'.url('dav','logs','errors.txt')),array('type'=>'file','url'=>'http://'.url('dav','logs','dav.txt'))));
		if($path=='logs/dav.txt') {
			$out=$this->proplist(array(array('type'=>'file','url'=>'http://'.url('dav','logs','dav.txt'),'getcontentlength'=>filesize('files/tmp.txt'))));
			$this->log_event($out);
			return $out;
		}
	}

	protected function logs_get($path) {
		if($path=='logs/dav.txt') {
			header('Content-Type: '.$this->finfo($path));
			header('Content-Length: '.filesize('files/tmp.txt'));
			$fp=fopen('files/tmp.txt');
			fpassthru($fp);
			fclose($fp);
			exit;
		}

		if($path=='logs/errors.txt') {
			header('Content-Type: '.$this->finfo($path));
			$db=PDOclass::get_instance();
			$tmp=$db->query_all('SELECT * FROM `error_log`');
			$out='';
			foreach($tmp as $a) {
				$out.=$a['error']."\n";
			}
			header('Content-Length: '.strlen($out));
			echo $out;
			exit;
		}
	}
}
?>
