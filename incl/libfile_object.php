<?php

class file_object {
	
	protected $path;
	protected $filename;
	protected $mime_type;
	protected $loaded=false;
	protected $file_dir;
	protected $type_path;
	

	public function __construct() {
		$this->file_dir=CWD.'/files/';
		if(!file_exists($this->file_dir)) mkdir($this->file_dir);
	}

	protected function gen_filename() {
		$name=md5(rand().microtime());
		return $name;
	}
	
	static public function gen_apc_id(){
		$id = md5(rand().microtime());
		return $id;
	}
	
	static public function apc_status($id){
		$upload = apc_fetch('upload_'.$id);
		if($upload) return $upload;
		return false;
	}

	protected function gen_filepath() {
		$name=$this->gen_filename();
		return $this->file_dir.$this->type_path.$this->path.$name;
	}

	public function get_md5() {
		return md5_file($this->full_path());
	}

	public function full_path() {
		return $this->file_dir.$this->type_path.$this->path.$this->filename;
	}

	public function get_type_path() {
		return $this->file_dir.$this->type_path;
	}

}
?>
