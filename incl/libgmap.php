<?php

/**
 * Google Maps API class
 *
 * Trenton Broughton
 *
 * Configuration:
 *	api_key
 *	caching 1/0
 */

class gmap {

	private $api_key;
	private $caching=false;

	public function __construct() {
		$conf=config::get_class_config('gmap');
		$this->api_key=(empty($conf['api_key'])) ? null : $conf['api_key'];
		$this->caching=(empty($conf['caching'])) ? false : true;
	}

	public function get_coords($address, $all = false, $table = null, $hash_key = null, $where = null) {
		$address=strtolower($address);
		$address_hash=md5($address);
		if($this->caching) {
			$dr=new datarow(null,'gmap_cache');
			$dr->search('hash',$address_hash);
			if($dr->is_loaded()){
				$dr->searches++;
				return $dr->as_array();
			}
		}
		$_url = sprintf('http://%s/maps/geo?&q=%s&output=json&gl=US&key=%s&sensor=false','maps.google.com',rawurlencode($address),$this->api_key);
		$_result = false;
		$_coords=array();
		if($_result = @file_get_contents($_url)) {
			$_result=json_decode($_result);
			if(empty($_result->Status->code) || $_result->Status->code!=200) return false;
			if(empty($_result->Placemark) || !count($_result->Placemark)) return false;
			$result_set=array();
			foreach($_result->Placemark as $x){
				$result_set[]=array('lat'=>$x->Point->coordinates[1],
									'lon'=>$x->Point->coordinates[0],
									'name'=>$x->address,
									'accuracy'=>$x->AddressDetails->Accuracy
									);
			}
			$_coords=$result_set[0];
		}else{
			return false;
		}
		if($this->caching) {
			$db=PDOclass::get_instance();
			$in=$_coords;
			$in['hash']=$address_hash;
			$in['term']=$address;
			$db->insert_array('gmap_cache',$in);
			if($table != null){
				$this->db->update_array($table, array($hash_key), $where);
			}
		}
		if($all) return $result_set;
        return $in;
    }

	static public function get_distance($address,$address2) {
		$gm=new self();
		$c1=$gm->get_coords($address);
		$c2=$gm->get_coords($address2);
		$distance = (((acos(sin(($c1['lat']*pi()/180)) * sin(($c2['lat']*pi()/180))+cos(($c1['lat']*pi()/180)) * cos(($c2['lat']*pi()/180)) * cos((($c1['lon']- $c2['lon'])*pi()/180))))*180/pi())*60*1.1515);
		return $distance;
	}

	static public function radius_search($address,$radius,$table=null) {
		$radius=(double)$radius;
		if($radius<0) $radius=$radius*-1;
		$gm=new self();
		$coords=$gm->get_coords($address);
		if(!is_array($coords)) return array();
		$coords['radius']=$radius;
		$db=PDOclass::get_instance();
		if($table===null) {
			$q="SELECT *,(((acos(sin((".$coords['lat']."*pi()/180)) * sin((`lat`*pi()/180))+cos((".$coords['lat']."*pi()/180)) * cos((`lat`*pi()/180)) * cos(((".$coords['lon']."- `lon`)*pi()/180))))*180/pi())*60*1.1515) as distance FROM `gmap_cache` WHERE (((acos(sin((".$coords['lat']."*pi()/180)) * sin((`lat`*pi()/180))+cos((".$coords['lat']."*pi()/180)) * cos((`lat`*pi()/180)) * cos(((".$coords['lon']."- `lon`)*pi()/180))))*180/pi())*60*1.1515) <= ? ORDER BY distance ASC";
			$tmp=$db->query_all($q,array($radius));
			if(!is_array($tmp)) return array();
			return $tmp;
		}else{
			$q="SELECT dist_lookup.distance, dist_lookup.radius, l.* FROM (SELECT *,(((acos(sin((".$coords['lat']."*pi()/180)) * sin((`lat`*pi()/180))+cos((".$coords['lat']."*pi()/180)) * cos((`lat`*pi()/180)) * cos(((".$coords['lon']."- `lon`)*pi()/180))))*180/pi())*60*1.1515) as distance FROM ".$table." WHERE (((acos(sin((".$coords['lat']."*pi()/180)) * sin((`lat`*pi()/180))+cos((".$coords['lat']."*pi()/180)) * cos((`lat`*pi()/180)) * cos(((".$coords['lon']."- `lon`)*pi()/180))))*180/pi())*60*1.1515) <= ? ORDER BY distance ASC) dist_lookup LEFT JOIN `listings_profile` l ON l.id=dist_lookup.lid WHERE dist_lookup.distance <= dist_lookup.radius AND l.page IS NOT NULL";
			$set=new dataset('listings_profile',$q,array($radius),'listings_profile');
			return $set;
		}
	}
}
?>