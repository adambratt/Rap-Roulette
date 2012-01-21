<?php

class dbfile {

	public $position=0;
	public $context;
	public $dir;
	private $dircont=array();
	private $dirpos=0;
	private $dircnt=null;
	public $f;
	private $db;
	private $dr;

	public function __construct() {
		$this->db=PDOclass::get_instance();
	}

	public function stream_open($path, $mode, $options, &$opened_path) {
		$path=parse_url($path);
		$path=$path['host'].$path['path'];
		$this->dr=new datarow(null,'pfiles');
		$this->dr->search('filename',$path);
		if(substr($mode,-1)=='b' || substr($mode,-1)=='b') $mode=substr($mode,0,strlen($mode)-1);
		if(!$this->dr->is_loaded()) {
			switch($mode) {
				case 'r':
				case 'r+':
				return false;
				break;
			}
			$this->dr->create(array());
			$tmp=array('filename'=>$path,'ctime'=>date('Y-m-d H:i:s'),'atime'=>date('Y-m-d H:i:s'));
			foreach($tmp as $k=>$v) {
				$this->dr->$k=$v;
			}
			$this->dr->commit();
		}else{
			switch($mode) {
				case 'x':
				case 'x+':
				return false;
				break;

				case 'w':
				case 'w+':
				$this->position=0;
				$this->dr->filedata='';
				break;

				case 'a':
				case 'a+':
				$this->position=strlen($this->dr->filedata);
				break;
			}
			$this->dr->atime=date('Y-m-d H:i:s');
		}
		return true;
	}
	
	public function stream_close() {
		$this->dr->commit();
	}

	public function stream_read($count) {
		$len=strlen($this->dr->filedata);
		if($this->position>=$len) {
			$this->position=$len;
			return false;
		}
		if(($this->position+$count) > $len) $count=$len-$this->position;
		$out=substr($this->dr->filedata,$this->position,$count);
		$this->position+=$count;
		return $out;
	}

	public function stream_write($data) {
		$this->dr->filedata.=$data;
		$len=strlen($data);
		$this->position+=$len;
		return $len;
	}

	public function stream_tell() {
        return $this->position;
	}

	public function stream_eof() {
		if($this->position>=strlen($this->dr->filedata)) return true;
		return false;
	}

	public function stream_seek($offset, $whence) {
		$len=strlen($this->dr->filedata);
		switch($whence) {
			case SEEK_SET:
			if($offset>$len) return false;
			$this->position=$offset;
			break;

			case SEEK_CUR:
			if($this->position+$offset>$len) return false;
			$this->position+=$offset;
			break;

			case SEEK_END:
			if($offset>0) return false;
			$this->position=$len;
			break;

			default:
			return false;
			break;
		}

		return false;
	}
	
	public function url_stat($path,$flags) {
		if(!$this->db) $this->db=PDOclass::get_instance();
		$path=parse_url($path);
		$path=$path['host'].$path['path'];
		$tmp=$this->db->query_all('SELECT `id`,`filename`, LENGTH(`filedata`) AS `length`, `atime`,`mtime`,`ctime` FROM `pfiles` WHERE `filename` LIKE ? LIMIT 1',array($path.'%'));
		if(!count($tmp)) return false;
		$mode=16804; // Dir filetype
		if($tmp[0]['filename']==$path) $mode=33188; // Regular file
		$tmp=$tmp[0];
		$out=array();
		$out[0]=$out['dev']=0;
		$out[1]=$out['ino']=$tmp['id'];
		$out[2]=$out['mode']=$mode;
		$out[3]=$out['nlink']=1;
		$out[4]=$out['uid']=0;
		$out[5]=$out['gid']=0;
		$out[6]=$out['rdev']=0;
		$out[7]=$out['size']=$tmp['length'];
		$out[8]=$out['atime']=strtotime($tmp['atime']);
		$out[9]=$out['mtime']=strtotime($tmp['mtime']);
		$out[10]=$out['ctime']=strtotime($tmp['ctime']);
		$out[11]=$out['blksize']=-1;
		$out[12]=$out['blocks']=-1;
		return $out;
	}

	public function stream_stat() {
		return $this->url_stat('db://'.$this->dr->filename,0);
	}

	public function dir_opendir($path,$options) {
		$this->db=PDOclass::get_instance();
		$url=parse_url($path);
		$path=$url['host'];
		if(isset($url['path'])) $path.=$url['path'];
		if(substr($path,-1)!='/') $path=$path.'/';
		if(substr($path,0,1)=='/' && strlen($path)>1) $path=substr($path,1);
		$tmp=$this->db->query_all('SELECT DISTINCT MID(`filename`,?,IF(LOCATE("/",`filename`,?)=0,100,LOCATE("/",`filename`,?)-?)) AS `files` FROM `pfiles` WHERE `filename` LIKE ?',array(strlen($path)+1,strlen($path)+1,strlen($path)+1,strlen($path)+1,$path.'%'));
		if(!count($tmp)) return false;
		$this->dir=$path;
		$this->dircnt=count($tmp);
		foreach($tmp as $a) {
			$this->dircont[]=$a['files'];
		}
		return true;
	}
	
	public function unlink($path) {
		if(!$this->db) $this->db=PDOclass::get_instance();
		if(substr($path,0,4)=='db:/') $path=substr($path,4);
		if(substr($path,0,1)=='/') $path=substr($path,1);
		$this->db->query_all('DELETE FROM `pfiles` WHERE `filename`=?',array($path));
		return true;
	}

	public function dir_readdir() {
		if($this->dirpos==count($this->dircont)) {
			$this->dirpos=0;
			return false;
		}
		$out=$this->dircont[$this->dirpos];
		$this->dirpos++;
		return $out;
	}

	public function dir_closedir() {
		$this->dir=null;
		$this->dircont=array();
		$this->dirpos=0;
	}

	public function dir_rewiddir() {
		$this->dirpos=0;
	}
}

?>