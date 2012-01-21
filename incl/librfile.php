<?php

class rfile extends datarow {

	protected $spath=null;
	protected $uploadpath=null;

	public function __construct($id=null) {
		$this->spath=CWD.'/files/rfile/';
		$this->uploadpath=$this->spath;
		if(!is_dir($this->spath)) mkdir($this->spath);
		parent::__construct($id,'files');
	}

	public function remove() {
		if(file_exists($this->spath.$this->filename)) unlink($this->spath.$this->filename);
		parent::remove();
	}

	static public function upload($key,$class=null) {
		if($class==null) {
			$rf=new self();
		}else{
			$rf=new $class();
		}
		if(!isset($_FILES[$key])) return null;
		if($_FILES[$key]['error']!=UPLOAD_ERR_OK) return null;
		$tmp_name = $_FILES[$key]["tmp_name"];
		$name=$rf->gen_filename();
		move_uploaded_file($tmp_name,$rf->uploadpath.$name);
		$rf->create(array('filename'=>$name,'original'=>$_FILES[$key]['name']));
		return $rf;
	}

	static public function import($file,$copy=false) {
		$rf=new self();
		if(!file_exists($file)) exit;
		$name=$rf->gen_filename();
		if($copy) {
			copy($file,$rf->spath.$name);
		}else{
			rename($file,$rf->spath.$name);
		}
		$rf->create(array('filename'=>$name,'original'=>basename($file)));
		return $rf;
	}

	public function download() {
		if(!$this->is_loaded()) return;
		header("Content-Disposition: attachment; filename=\"". urlencode($this->original).'"');   
		header("Content-Type: application/force-download");
		header("Content-Type: application/octet-stream");
		header("Content-Type: application/download");
		header("Content-Description: File Transfer");            
		header("Content-Length: " . filesize($this->spath.$this->filename));
		readfile($this->spath.$this->filename);
		exit;
	}

	public function play() {
		header('Content-type: audio/mpeg');
		$size=filesize($this->spath.$this->filename);
		header("Content-Length: " .(string)$size);
		readfile($this->spath.$this->filename);
		exit;
	}

	private function gen_filename() {
		//do{
			$fname=md5(microtime().'A Salty Filename');
		//}while(!file_exists($this->spath.$fname));
		return $fname;
	}
	
	public function __get($key) {
		switch($key) {
			case 'contents':
			return file_get_contents($this->spath.$this->filename);
		}

		return parent::__get($key);
	}
}
?>
