// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.31.0
// 	protoc        v3.20.3
// source: proto/asteroids.proto

package asteroidspb

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type OrbitType int32

const (
	OrbitType_ORBIT_TYPE_UNKNOWN        OrbitType = 0
	OrbitType_ORBIT_TYPE_Q_BOUNDED      OrbitType = 1
	OrbitType_ORBIT_TYPE_HUNGARIA       OrbitType = 2
	OrbitType_ORBIT_TYPE_HILDA          OrbitType = 3
	OrbitType_ORBIT_TYPE_JUPITER_TROJAN OrbitType = 4
	OrbitType_ORBIT_TYPE_NEO            OrbitType = 5
	OrbitType_ORBIT_TYPE_ASTEROID_BELT  OrbitType = 6
)

// Enum value maps for OrbitType.
var (
	OrbitType_name = map[int32]string{
		0: "ORBIT_TYPE_UNKNOWN",
		1: "ORBIT_TYPE_Q_BOUNDED",
		2: "ORBIT_TYPE_HUNGARIA",
		3: "ORBIT_TYPE_HILDA",
		4: "ORBIT_TYPE_JUPITER_TROJAN",
		5: "ORBIT_TYPE_NEO",
		6: "ORBIT_TYPE_ASTEROID_BELT",
	}
	OrbitType_value = map[string]int32{
		"ORBIT_TYPE_UNKNOWN":        0,
		"ORBIT_TYPE_Q_BOUNDED":      1,
		"ORBIT_TYPE_HUNGARIA":       2,
		"ORBIT_TYPE_HILDA":          3,
		"ORBIT_TYPE_JUPITER_TROJAN": 4,
		"ORBIT_TYPE_NEO":            5,
		"ORBIT_TYPE_ASTEROID_BELT":  6,
	}
)

func (x OrbitType) Enum() *OrbitType {
	p := new(OrbitType)
	*p = x
	return p
}

func (x OrbitType) String() string {
	return protoimpl.X.EnumStringOf(x.Descriptor(), protoreflect.EnumNumber(x))
}

func (OrbitType) Descriptor() protoreflect.EnumDescriptor {
	return file_proto_asteroids_proto_enumTypes[0].Descriptor()
}

func (OrbitType) Type() protoreflect.EnumType {
	return &file_proto_asteroids_proto_enumTypes[0]
}

func (x OrbitType) Number() protoreflect.EnumNumber {
	return protoreflect.EnumNumber(x)
}

// Deprecated: Use OrbitType.Descriptor instead.
func (OrbitType) EnumDescriptor() ([]byte, []int) {
	return file_proto_asteroids_proto_rawDescGZIP(), []int{0}
}

type Asteroids struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	TimeCreated    uint32           `protobuf:"varint,1,opt,name=time_created,json=timeCreated,proto3" json:"time_created,omitempty"` // Unix seconds.
	EpochTime      uint32           `protobuf:"varint,2,opt,name=epoch_time,json=epochTime,proto3" json:"epoch_time,omitempty"`       // Unix seconds.
	AsteroidGroups []*AsteroidGroup `protobuf:"bytes,3,rep,name=asteroid_groups,json=asteroidGroups,proto3" json:"asteroid_groups,omitempty"`
}

func (x *Asteroids) Reset() {
	*x = Asteroids{}
	if protoimpl.UnsafeEnabled {
		mi := &file_proto_asteroids_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Asteroids) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Asteroids) ProtoMessage() {}

func (x *Asteroids) ProtoReflect() protoreflect.Message {
	mi := &file_proto_asteroids_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Asteroids.ProtoReflect.Descriptor instead.
func (*Asteroids) Descriptor() ([]byte, []int) {
	return file_proto_asteroids_proto_rawDescGZIP(), []int{0}
}

func (x *Asteroids) GetTimeCreated() uint32 {
	if x != nil {
		return x.TimeCreated
	}
	return 0
}

func (x *Asteroids) GetEpochTime() uint32 {
	if x != nil {
		return x.EpochTime
	}
	return 0
}

func (x *Asteroids) GetAsteroidGroups() []*AsteroidGroup {
	if x != nil {
		return x.AsteroidGroups
	}
	return nil
}

type AsteroidGroup struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	OrbitType OrbitType `protobuf:"varint,1,opt,name=orbit_type,json=orbitType,proto3,enum=OrbitType" json:"orbit_type,omitempty"`
	// Asteroids in the group.
	Asteroids []*Asteroid `protobuf:"bytes,2,rep,name=asteroids,proto3" json:"asteroids,omitempty"`
}

func (x *AsteroidGroup) Reset() {
	*x = AsteroidGroup{}
	if protoimpl.UnsafeEnabled {
		mi := &file_proto_asteroids_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *AsteroidGroup) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*AsteroidGroup) ProtoMessage() {}

func (x *AsteroidGroup) ProtoReflect() protoreflect.Message {
	mi := &file_proto_asteroids_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use AsteroidGroup.ProtoReflect.Descriptor instead.
func (*AsteroidGroup) Descriptor() ([]byte, []int) {
	return file_proto_asteroids_proto_rawDescGZIP(), []int{1}
}

func (x *AsteroidGroup) GetOrbitType() OrbitType {
	if x != nil {
		return x.OrbitType
	}
	return OrbitType_ORBIT_TYPE_UNKNOWN
}

func (x *AsteroidGroup) GetAsteroids() []*Asteroid {
	if x != nil {
		return x.Asteroids
	}
	return nil
}

// Orbital elements for an asteroid.
type Asteroid struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Eccentricity           float32 `protobuf:"fixed32,1,opt,name=eccentricity,proto3" json:"eccentricity,omitempty"`
	SemiMajorAxis          float32 `protobuf:"fixed32,2,opt,name=semi_major_axis,json=semiMajorAxis,proto3" json:"semi_major_axis,omitempty"`
	Inclination            float32 `protobuf:"fixed32,3,opt,name=inclination,proto3" json:"inclination,omitempty"`
	LongitudeAscendingNode float32 `protobuf:"fixed32,4,opt,name=longitude_ascending_node,json=longitudeAscendingNode,proto3" json:"longitude_ascending_node,omitempty"`
	ArgumentOfPerihelion   float32 `protobuf:"fixed32,5,opt,name=argument_of_perihelion,json=argumentOfPerihelion,proto3" json:"argument_of_perihelion,omitempty"`
	MeanAnomaly            float32 `protobuf:"fixed32,6,opt,name=mean_anomaly,json=meanAnomaly,proto3" json:"mean_anomaly,omitempty"`
}

func (x *Asteroid) Reset() {
	*x = Asteroid{}
	if protoimpl.UnsafeEnabled {
		mi := &file_proto_asteroids_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Asteroid) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Asteroid) ProtoMessage() {}

func (x *Asteroid) ProtoReflect() protoreflect.Message {
	mi := &file_proto_asteroids_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Asteroid.ProtoReflect.Descriptor instead.
func (*Asteroid) Descriptor() ([]byte, []int) {
	return file_proto_asteroids_proto_rawDescGZIP(), []int{2}
}

func (x *Asteroid) GetEccentricity() float32 {
	if x != nil {
		return x.Eccentricity
	}
	return 0
}

func (x *Asteroid) GetSemiMajorAxis() float32 {
	if x != nil {
		return x.SemiMajorAxis
	}
	return 0
}

func (x *Asteroid) GetInclination() float32 {
	if x != nil {
		return x.Inclination
	}
	return 0
}

func (x *Asteroid) GetLongitudeAscendingNode() float32 {
	if x != nil {
		return x.LongitudeAscendingNode
	}
	return 0
}

func (x *Asteroid) GetArgumentOfPerihelion() float32 {
	if x != nil {
		return x.ArgumentOfPerihelion
	}
	return 0
}

func (x *Asteroid) GetMeanAnomaly() float32 {
	if x != nil {
		return x.MeanAnomaly
	}
	return 0
}

var File_proto_asteroids_proto protoreflect.FileDescriptor

var file_proto_asteroids_proto_rawDesc = []byte{
	0x0a, 0x15, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x2f, 0x61, 0x73, 0x74, 0x65, 0x72, 0x6f, 0x69, 0x64,
	0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x22, 0x86, 0x01, 0x0a, 0x09, 0x41, 0x73, 0x74, 0x65,
	0x72, 0x6f, 0x69, 0x64, 0x73, 0x12, 0x21, 0x0a, 0x0c, 0x74, 0x69, 0x6d, 0x65, 0x5f, 0x63, 0x72,
	0x65, 0x61, 0x74, 0x65, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0d, 0x52, 0x0b, 0x74, 0x69, 0x6d,
	0x65, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x64, 0x12, 0x1d, 0x0a, 0x0a, 0x65, 0x70, 0x6f, 0x63,
	0x68, 0x5f, 0x74, 0x69, 0x6d, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0d, 0x52, 0x09, 0x65, 0x70,
	0x6f, 0x63, 0x68, 0x54, 0x69, 0x6d, 0x65, 0x12, 0x37, 0x0a, 0x0f, 0x61, 0x73, 0x74, 0x65, 0x72,
	0x6f, 0x69, 0x64, 0x5f, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x73, 0x18, 0x03, 0x20, 0x03, 0x28, 0x0b,
	0x32, 0x0e, 0x2e, 0x41, 0x73, 0x74, 0x65, 0x72, 0x6f, 0x69, 0x64, 0x47, 0x72, 0x6f, 0x75, 0x70,
	0x52, 0x0e, 0x61, 0x73, 0x74, 0x65, 0x72, 0x6f, 0x69, 0x64, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x73,
	0x22, 0x63, 0x0a, 0x0d, 0x41, 0x73, 0x74, 0x65, 0x72, 0x6f, 0x69, 0x64, 0x47, 0x72, 0x6f, 0x75,
	0x70, 0x12, 0x29, 0x0a, 0x0a, 0x6f, 0x72, 0x62, 0x69, 0x74, 0x5f, 0x74, 0x79, 0x70, 0x65, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x0a, 0x2e, 0x4f, 0x72, 0x62, 0x69, 0x74, 0x54, 0x79, 0x70,
	0x65, 0x52, 0x09, 0x6f, 0x72, 0x62, 0x69, 0x74, 0x54, 0x79, 0x70, 0x65, 0x12, 0x27, 0x0a, 0x09,
	0x61, 0x73, 0x74, 0x65, 0x72, 0x6f, 0x69, 0x64, 0x73, 0x18, 0x02, 0x20, 0x03, 0x28, 0x0b, 0x32,
	0x09, 0x2e, 0x41, 0x73, 0x74, 0x65, 0x72, 0x6f, 0x69, 0x64, 0x52, 0x09, 0x61, 0x73, 0x74, 0x65,
	0x72, 0x6f, 0x69, 0x64, 0x73, 0x22, 0x8b, 0x02, 0x0a, 0x08, 0x41, 0x73, 0x74, 0x65, 0x72, 0x6f,
	0x69, 0x64, 0x12, 0x22, 0x0a, 0x0c, 0x65, 0x63, 0x63, 0x65, 0x6e, 0x74, 0x72, 0x69, 0x63, 0x69,
	0x74, 0x79, 0x18, 0x01, 0x20, 0x01, 0x28, 0x02, 0x52, 0x0c, 0x65, 0x63, 0x63, 0x65, 0x6e, 0x74,
	0x72, 0x69, 0x63, 0x69, 0x74, 0x79, 0x12, 0x26, 0x0a, 0x0f, 0x73, 0x65, 0x6d, 0x69, 0x5f, 0x6d,
	0x61, 0x6a, 0x6f, 0x72, 0x5f, 0x61, 0x78, 0x69, 0x73, 0x18, 0x02, 0x20, 0x01, 0x28, 0x02, 0x52,
	0x0d, 0x73, 0x65, 0x6d, 0x69, 0x4d, 0x61, 0x6a, 0x6f, 0x72, 0x41, 0x78, 0x69, 0x73, 0x12, 0x20,
	0x0a, 0x0b, 0x69, 0x6e, 0x63, 0x6c, 0x69, 0x6e, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x03, 0x20,
	0x01, 0x28, 0x02, 0x52, 0x0b, 0x69, 0x6e, 0x63, 0x6c, 0x69, 0x6e, 0x61, 0x74, 0x69, 0x6f, 0x6e,
	0x12, 0x38, 0x0a, 0x18, 0x6c, 0x6f, 0x6e, 0x67, 0x69, 0x74, 0x75, 0x64, 0x65, 0x5f, 0x61, 0x73,
	0x63, 0x65, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0x5f, 0x6e, 0x6f, 0x64, 0x65, 0x18, 0x04, 0x20, 0x01,
	0x28, 0x02, 0x52, 0x16, 0x6c, 0x6f, 0x6e, 0x67, 0x69, 0x74, 0x75, 0x64, 0x65, 0x41, 0x73, 0x63,
	0x65, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0x4e, 0x6f, 0x64, 0x65, 0x12, 0x34, 0x0a, 0x16, 0x61, 0x72,
	0x67, 0x75, 0x6d, 0x65, 0x6e, 0x74, 0x5f, 0x6f, 0x66, 0x5f, 0x70, 0x65, 0x72, 0x69, 0x68, 0x65,
	0x6c, 0x69, 0x6f, 0x6e, 0x18, 0x05, 0x20, 0x01, 0x28, 0x02, 0x52, 0x14, 0x61, 0x72, 0x67, 0x75,
	0x6d, 0x65, 0x6e, 0x74, 0x4f, 0x66, 0x50, 0x65, 0x72, 0x69, 0x68, 0x65, 0x6c, 0x69, 0x6f, 0x6e,
	0x12, 0x21, 0x0a, 0x0c, 0x6d, 0x65, 0x61, 0x6e, 0x5f, 0x61, 0x6e, 0x6f, 0x6d, 0x61, 0x6c, 0x79,
	0x18, 0x06, 0x20, 0x01, 0x28, 0x02, 0x52, 0x0b, 0x6d, 0x65, 0x61, 0x6e, 0x41, 0x6e, 0x6f, 0x6d,
	0x61, 0x6c, 0x79, 0x2a, 0xbd, 0x01, 0x0a, 0x09, 0x4f, 0x72, 0x62, 0x69, 0x74, 0x54, 0x79, 0x70,
	0x65, 0x12, 0x16, 0x0a, 0x12, 0x4f, 0x52, 0x42, 0x49, 0x54, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f,
	0x55, 0x4e, 0x4b, 0x4e, 0x4f, 0x57, 0x4e, 0x10, 0x00, 0x12, 0x18, 0x0a, 0x14, 0x4f, 0x52, 0x42,
	0x49, 0x54, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f, 0x51, 0x5f, 0x42, 0x4f, 0x55, 0x4e, 0x44, 0x45,
	0x44, 0x10, 0x01, 0x12, 0x17, 0x0a, 0x13, 0x4f, 0x52, 0x42, 0x49, 0x54, 0x5f, 0x54, 0x59, 0x50,
	0x45, 0x5f, 0x48, 0x55, 0x4e, 0x47, 0x41, 0x52, 0x49, 0x41, 0x10, 0x02, 0x12, 0x14, 0x0a, 0x10,
	0x4f, 0x52, 0x42, 0x49, 0x54, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f, 0x48, 0x49, 0x4c, 0x44, 0x41,
	0x10, 0x03, 0x12, 0x1d, 0x0a, 0x19, 0x4f, 0x52, 0x42, 0x49, 0x54, 0x5f, 0x54, 0x59, 0x50, 0x45,
	0x5f, 0x4a, 0x55, 0x50, 0x49, 0x54, 0x45, 0x52, 0x5f, 0x54, 0x52, 0x4f, 0x4a, 0x41, 0x4e, 0x10,
	0x04, 0x12, 0x12, 0x0a, 0x0e, 0x4f, 0x52, 0x42, 0x49, 0x54, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f,
	0x4e, 0x45, 0x4f, 0x10, 0x05, 0x12, 0x1c, 0x0a, 0x18, 0x4f, 0x52, 0x42, 0x49, 0x54, 0x5f, 0x54,
	0x59, 0x50, 0x45, 0x5f, 0x41, 0x53, 0x54, 0x45, 0x52, 0x4f, 0x49, 0x44, 0x5f, 0x42, 0x45, 0x4c,
	0x54, 0x10, 0x06, 0x42, 0x32, 0x5a, 0x30, 0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f,
	0x6d, 0x2f, 0x61, 0x6c, 0x65, 0x78, 0x2d, 0x6b, 0x65, 0x6e, 0x6e, 0x65, 0x64, 0x79, 0x2f, 0x73,
	0x6f, 0x6c, 0x61, 0x72, 0x2d, 0x73, 0x79, 0x73, 0x74, 0x65, 0x6d, 0x2f, 0x61, 0x73, 0x74, 0x65,
	0x72, 0x6f, 0x69, 0x64, 0x73, 0x70, 0x62, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_proto_asteroids_proto_rawDescOnce sync.Once
	file_proto_asteroids_proto_rawDescData = file_proto_asteroids_proto_rawDesc
)

func file_proto_asteroids_proto_rawDescGZIP() []byte {
	file_proto_asteroids_proto_rawDescOnce.Do(func() {
		file_proto_asteroids_proto_rawDescData = protoimpl.X.CompressGZIP(file_proto_asteroids_proto_rawDescData)
	})
	return file_proto_asteroids_proto_rawDescData
}

var file_proto_asteroids_proto_enumTypes = make([]protoimpl.EnumInfo, 1)
var file_proto_asteroids_proto_msgTypes = make([]protoimpl.MessageInfo, 3)
var file_proto_asteroids_proto_goTypes = []interface{}{
	(OrbitType)(0),        // 0: OrbitType
	(*Asteroids)(nil),     // 1: Asteroids
	(*AsteroidGroup)(nil), // 2: AsteroidGroup
	(*Asteroid)(nil),      // 3: Asteroid
}
var file_proto_asteroids_proto_depIdxs = []int32{
	2, // 0: Asteroids.asteroid_groups:type_name -> AsteroidGroup
	0, // 1: AsteroidGroup.orbit_type:type_name -> OrbitType
	3, // 2: AsteroidGroup.asteroids:type_name -> Asteroid
	3, // [3:3] is the sub-list for method output_type
	3, // [3:3] is the sub-list for method input_type
	3, // [3:3] is the sub-list for extension type_name
	3, // [3:3] is the sub-list for extension extendee
	0, // [0:3] is the sub-list for field type_name
}

func init() { file_proto_asteroids_proto_init() }
func file_proto_asteroids_proto_init() {
	if File_proto_asteroids_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_proto_asteroids_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Asteroids); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_proto_asteroids_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*AsteroidGroup); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_proto_asteroids_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Asteroid); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_proto_asteroids_proto_rawDesc,
			NumEnums:      1,
			NumMessages:   3,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_proto_asteroids_proto_goTypes,
		DependencyIndexes: file_proto_asteroids_proto_depIdxs,
		EnumInfos:         file_proto_asteroids_proto_enumTypes,
		MessageInfos:      file_proto_asteroids_proto_msgTypes,
	}.Build()
	File_proto_asteroids_proto = out.File
	file_proto_asteroids_proto_rawDesc = nil
	file_proto_asteroids_proto_goTypes = nil
	file_proto_asteroids_proto_depIdxs = nil
}
